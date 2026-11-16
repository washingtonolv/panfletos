//! Numeric layout only. Documents and product content stay in the React editor.
const MAX_BLOCKS: usize = 250_000;

#[unsafe(no_mangle)]
pub extern "C" fn abi_version() -> u32 { 1 }

/// Kinds: 0 header, 1 site footer, 2 payment footer, 3 product block.
#[unsafe(no_mangle)]
pub extern "C" fn minimum_height(kind: u32, products: u32, large_tag: u32, has_title: u32, custom: f64) -> f64 {
    if custom.is_finite() && custom > 0.0 { return custom; }
    match kind {
        0 => 108.0,
        1 => 56.0,
        2 => 88.0,
        _ => {
            let photo = if large_tag != 0 { ((554.0 / products.max(1) as f64 - 10.0) * 0.24).clamp(24.0, 64.0) } else { 0.0 };
            (58.0 + 72.0 + photo + if has_title != 0 { 24.0 } else { 0.0 }).ceil()
        }
    }
}

/// Replaces heights (including each block's 6px gap) with zero-based page indexes.
fn assign_pages(heights: &mut [f64], height: f64) -> u32 {
    let mut page = 0;
    let mut used = 0.0;
    let mut count = 0;
    for slot in heights {
        let block_height = *slot;
        if used + block_height > height - 30.0 && count > 0 {
            page += 1; used = 0.0; count = 0;
        }
        *slot = page as f64;
        used += block_height; count += 1;
    }
    page + 1
}

#[unsafe(no_mangle)]
pub extern "C" fn allocate(len: usize) -> *mut f64 {
    if len == 0 || len > MAX_BLOCKS { return std::ptr::null_mut(); }
    Box::into_raw(vec![0.0; len].into_boxed_slice()) as *mut f64
}

/// # Safety
/// `ptr` must be a live allocation from `allocate(len)`, containing `len` f64s.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn paginate(ptr: *mut f64, len: usize, height: f64) -> u32 {
    if ptr.is_null() || len == 0 || len > MAX_BLOCKS || !height.is_finite() { return 0; }
    // The TypeScript bridge owns this buffer until the matching release.
    let heights = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
    if heights.iter().any(|h| !h.is_finite() || *h < 0.0) { return 0; }
    assign_pages(heights, height)
}

/// # Safety
/// Must receive the original pointer and length, once, after `paginate` finishes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn release(ptr: *mut f64, len: usize) {
    if !ptr.is_null() && len > 0 && len <= MAX_BLOCKS {
        unsafe { drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len))); }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sizes_match_current_layout_rules() {
        assert_eq!(minimum_height(0, 0, 0, 0, 0.0), 108.0);
        assert_eq!(minimum_height(1, 0, 0, 0, 0.0), 56.0);
        assert_eq!(minimum_height(2, 0, 0, 0, 0.0), 88.0);
        assert_eq!(minimum_height(3, 1, 1, 0, 0.0), 194.0);
        assert_eq!(minimum_height(3, 5, 1, 1, 0.0), 179.0);
        assert_eq!(minimum_height(3, 3, 0, 0, 82.5), 82.5);
    }

    #[test]
    fn boundary_empty_and_oversized_blocks() {
        assert_eq!(assign_pages(&mut [], 782.0), 1);
        let mut exact = [376.0, 376.0, 1.0];
        assert_eq!(assign_pages(&mut exact, 782.0), 2);
        assert_eq!(exact, [0.0, 0.0, 1.0]);
        let mut oversized = [2000.0, 136.0];
        assert_eq!(assign_pages(&mut oversized, 782.0), 2);
        assert_eq!(oversized, [0.0, 1.0]);
    }

    #[test]
    fn larger_page_preserves_order_and_uses_fewer_pages() {
        let mut small = [136.0; 7];
        let mut large = small;
        assert_eq!(assign_pages(&mut small, 782.0), 2);
        assert_eq!(assign_pages(&mut large, 1020.0), 1);
        assert_eq!(small, [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0]);
    }

    #[test]
    fn allocation_round_trip_and_invalid_input() {
        assert!(allocate(0).is_null());
        assert!(allocate(MAX_BLOCKS + 1).is_null());
        let ptr = allocate(3);
        assert!(!ptr.is_null());
        unsafe {
            std::slice::from_raw_parts_mut(ptr, 3).copy_from_slice(&[400.0, 400.0, 50.0]);
            assert_eq!(paginate(ptr, 3, 782.0), 2);
            assert_eq!(std::slice::from_raw_parts(ptr, 3), &[0.0, 1.0, 1.0]);
            release(ptr, 3);
            assert_eq!(paginate(std::ptr::null_mut(), 1, 782.0), 0);
        }
    }
}
