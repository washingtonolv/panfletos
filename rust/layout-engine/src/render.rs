//! SVG compositor: the host supplies measured paint primitives, never HTML.
use std::fmt::Write;

const MAX_BYTES: usize = 64 * 1024 * 1024;
struct Scene {
    width: f64,
    height: f64,
    assets: Vec<Asset>,
    commands: Vec<Command>,
}
struct Asset {
    href: String,
    width: f64,
    height: f64,
}
enum Command {
    Rect {
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        radius: f64,
        fill: String,
        opacity: f64,
    },
    Line {
        x: f64,
        y: f64,
        x2: f64,
        y2: f64,
        width: f64,
        color: String,
        dash: Vec<f64>,
    },
    Ellipse {
        cx: f64,
        cy: f64,
        rx: f64,
        ry: f64,
        fill: String,
        opacity: f64,
    },
    Text {
        x: f64,
        y: f64,
        text: String,
        font: String,
        size: f64,
        weight: String,
        italic: bool,
        spacing: f64,
        color: String,
    },
    Image {
        asset: usize,
        x: f64,
        y: f64,
        w: f64,
        h: f64,
    },
    Clip {
        x: f64,
        y: f64,
        w: f64,
        h: f64,
        radius: f64,
        points: Vec<[f64; 2]>,
    },
    Pop,
}
struct Reader<'a> {
    bytes: &'a [u8],
    at: usize,
}
impl<'a> Reader<'a> {
    fn take(&mut self, count: usize) -> Option<&'a [u8]> {
        let end = self.at.checked_add(count)?;
        let result = self.bytes.get(self.at..end)?;
        self.at = end;
        Some(result)
    }
    fn u8(&mut self) -> Option<u8> {
        Some(*self.take(1)?.first()?)
    }
    fn u32(&mut self) -> Option<u32> {
        Some(u32::from_le_bytes(self.take(4)?.try_into().ok()?))
    }
    fn f64(&mut self) -> Option<f64> {
        Some(f64::from_le_bytes(self.take(8)?.try_into().ok()?))
    }
    fn string(&mut self) -> Option<String> {
        let len = self.u32()? as usize;
        Some(std::str::from_utf8(self.take(len)?).ok()?.to_owned())
    }
}
fn read_scene(bytes: &[u8]) -> Option<Scene> {
    let mut r = Reader { bytes, at: 0 };
    if r.take(4)? != b"RSVG" || r.u32()? != 1 {
        return None;
    }
    let width = r.f64()?;
    let height = r.f64()?;
    let asset_count = r.u32()? as usize;
    let command_count = r.u32()? as usize;
    if asset_count > 2000 || command_count > 20_000 {
        return None;
    }
    let mut assets = Vec::with_capacity(asset_count);
    for _ in 0..asset_count {
        assets.push(Asset {
            width: r.f64()?,
            height: r.f64()?,
            href: r.string()?,
        });
    }
    let mut commands = Vec::with_capacity(command_count);
    for _ in 0..command_count {
        commands.push(match r.u8()? {
            0 => Command::Rect {
                x: r.f64()?,
                y: r.f64()?,
                w: r.f64()?,
                h: r.f64()?,
                radius: r.f64()?,
                opacity: r.f64()?,
                fill: r.string()?,
            },
            1 => {
                let x = r.f64()?;
                let y = r.f64()?;
                let x2 = r.f64()?;
                let y2 = r.f64()?;
                let width = r.f64()?;
                let color = r.string()?;
                let len = r.u32()? as usize;
                if len > 16 {
                    return None;
                }
                let dash = (0..len).map(|_| r.f64()).collect::<Option<Vec<_>>>()?;
                Command::Line {
                    x,
                    y,
                    x2,
                    y2,
                    width,
                    color,
                    dash,
                }
            }
            2 => Command::Ellipse {
                cx: r.f64()?,
                cy: r.f64()?,
                rx: r.f64()?,
                ry: r.f64()?,
                opacity: r.f64()?,
                fill: r.string()?,
            },
            3 => Command::Text {
                x: r.f64()?,
                y: r.f64()?,
                size: r.f64()?,
                spacing: r.f64()?,
                italic: r.u8()? != 0,
                text: r.string()?,
                font: r.string()?,
                weight: r.string()?,
                color: r.string()?,
            },
            4 => Command::Image {
                asset: r.u32()? as usize,
                x: r.f64()?,
                y: r.f64()?,
                w: r.f64()?,
                h: r.f64()?,
            },
            5 => {
                let x = r.f64()?;
                let y = r.f64()?;
                let w = r.f64()?;
                let h = r.f64()?;
                let radius = r.f64()?;
                let len = r.u32()? as usize;
                if len > 64 {
                    return None;
                }
                let points = (0..len)
                    .map(|_| Some([r.f64()?, r.f64()?]))
                    .collect::<Option<Vec<_>>>()?;
                Command::Clip {
                    x,
                    y,
                    w,
                    h,
                    radius,
                    points,
                }
            }
            6 => Command::Pop,
            _ => return None,
        });
    }
    if r.at != bytes.len() {
        return None;
    }
    Some(Scene {
        width,
        height,
        assets,
        commands,
    })
}
fn xml(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            c if c < ' ' && c != '\n' && c != '\t' && c != '\r' => out.push('\u{fffd}'),
            c => out.push(c),
        }
    }
    out
}
fn numbers(values: &[f64]) -> bool {
    values
        .iter()
        .all(|n| n.is_finite() && n.abs() <= 1_000_000.0)
}
fn color(value: &str) -> bool {
    value.len() <= 100
        && !value.contains(['<', '>', '"', '\'', ';', ':', '/'])
        && !value.to_lowercase().contains("url")
}

fn compose(bytes: &[u8]) -> Option<String> {
    if bytes.len() > MAX_BYTES {
        return None;
    }
    let scene = read_scene(bytes)?;
    if !numbers(&[scene.width, scene.height])
        || !(1.0..=4096.0).contains(&scene.width)
        || !(1.0..=4096.0).contains(&scene.height)
        || scene.commands.len() > 20_000
        || scene.assets.len() > 2000
    {
        return None;
    }
    let mut svg = format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" viewBox=\"0 0 {} {}\" data-renderer=\"rust-svg\"><defs>",
        scene.width, scene.height, scene.width, scene.height
    );
    for (index, asset) in scene.assets.iter().enumerate() {
        if !numbers(&[asset.width, asset.height]) || asset.width <= 0.0 || asset.height <= 0.0 {
            return None;
        }
        let valid = ["png", "jpeg", "webp", "svg+xml", "gif"]
            .iter()
            .any(|mime| {
                asset
                    .href
                    .starts_with(&format!("data:image/{mime};base64,"))
            });
        let payload = asset.href.split_once(',')?.1;
        if !valid
            || !payload
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"+/=".contains(&b))
        {
            return None;
        }
        write!(
            svg,
            "<image id=\"a{index}\" width=\"{}\" height=\"{}\" href=\"{}\"/>",
            asset.width,
            asset.height,
            xml(&asset.href)
        )
        .ok()?;
    }
    svg.push_str("</defs>");
    let mut depth = 0;
    let mut clip_id = 0;
    for command in scene.commands {
        match command {
            Command::Rect {
                x,
                y,
                w,
                h,
                radius,
                fill,
                opacity,
            } => {
                if !numbers(&[x, y, w, h, radius, opacity])
                    || w < 0.0
                    || h < 0.0
                    || radius < 0.0
                    || !(0.0..=1.0).contains(&opacity)
                    || !color(&fill)
                {
                    return None;
                }
                write!(svg, "<rect x=\"{x}\" y=\"{y}\" width=\"{w}\" height=\"{h}\" rx=\"{radius}\" fill=\"{}\" opacity=\"{opacity}\"/>", xml(&fill)).ok()?;
            }
            Command::Line {
                x,
                y,
                x2,
                y2,
                width,
                color: ink,
                dash,
            } => {
                if !numbers(&[x, y, x2, y2, width])
                    || width < 0.0
                    || !color(&ink)
                    || dash.len() > 16
                    || !numbers(&dash)
                    || dash.iter().any(|n| *n < 0.0)
                {
                    return None;
                }
                let dash = dash
                    .iter()
                    .map(|n| n.to_string())
                    .collect::<Vec<_>>()
                    .join(" ");
                write!(svg, "<path d=\"M{x} {y} L{x2} {y2}\" fill=\"none\" stroke=\"{}\" stroke-width=\"{width}\" stroke-dasharray=\"{dash}\"/>", xml(&ink)).ok()?;
            }
            Command::Ellipse {
                cx,
                cy,
                rx,
                ry,
                fill,
                opacity,
            } => {
                if !numbers(&[cx, cy, rx, ry, opacity])
                    || rx < 0.0
                    || ry < 0.0
                    || !(0.0..=1.0).contains(&opacity)
                    || !color(&fill)
                {
                    return None;
                }
                write!(svg, "<ellipse cx=\"{cx}\" cy=\"{cy}\" rx=\"{rx}\" ry=\"{ry}\" fill=\"{}\" opacity=\"{opacity}\"/>", xml(&fill)).ok()?;
            }
            Command::Text {
                x,
                y,
                text,
                font,
                size,
                weight,
                italic,
                spacing,
                color: ink,
            } => {
                if !numbers(&[x, y, size, spacing])
                    || size <= 0.0
                    || size > 512.0
                    || text.len() > 65_536
                    || font.len() > 500
                    || !color(&ink)
                    || ![
                        "100", "200", "300", "400", "500", "600", "700", "800", "900", "normal",
                        "bold",
                    ]
                    .contains(&weight.as_str())
                {
                    return None;
                }
                write!(svg, "<text x=\"{x}\" y=\"{y}\" font-family=\"{}\" font-size=\"{size}\" font-weight=\"{}\" font-style=\"{}\" letter-spacing=\"{spacing}\" fill=\"{}\" xml:space=\"preserve\">{}</text>", xml(&font), weight, if italic { "italic" } else { "normal" }, xml(&ink), xml(&text)).ok()?;
            }
            Command::Image { asset, x, y, w, h } => {
                let image = scene.assets.get(asset)?;
                if !numbers(&[x, y, w, h]) || w < 0.0 || h < 0.0 {
                    return None;
                }
                write!(
                    svg,
                    "<use href=\"#a{asset}\" transform=\"translate({x} {y}) scale({} {})\"/>",
                    w / image.width,
                    h / image.height
                )
                .ok()?;
            }
            Command::Clip {
                x,
                y,
                w,
                h,
                radius,
                points,
            } => {
                if depth >= 128
                    || !numbers(&[x, y, w, h, radius])
                    || w < 0.0
                    || h < 0.0
                    || radius < 0.0
                    || points.len() > 64
                    || points.iter().any(|p| !numbers(p))
                    || (!points.is_empty() && points.len() < 3)
                {
                    return None;
                }
                write!(svg, "<defs><clipPath id=\"c{clip_id}\">").ok()?;
                if points.is_empty() {
                    write!(
                        svg,
                        "<rect x=\"{x}\" y=\"{y}\" width=\"{w}\" height=\"{h}\" rx=\"{radius}\"/>"
                    )
                    .ok()?;
                } else {
                    let points = points
                        .iter()
                        .map(|p| format!("{},{}", p[0], p[1]))
                        .collect::<Vec<_>>()
                        .join(" ");
                    write!(svg, "<polygon points=\"{points}\"/>").ok()?;
                }
                write!(svg, "</clipPath></defs><g clip-path=\"url(#c{clip_id})\">").ok()?;
                depth += 1;
                clip_id += 1;
            }
            Command::Pop => {
                if depth == 0 {
                    return None;
                }
                depth -= 1;
                svg.push_str("</g>");
            }
        }
        if svg.len() > MAX_BYTES * 2 {
            return None;
        }
    }
    if depth != 0 {
        return None;
    }
    svg.push_str("</svg>");
    Some(svg)
}

#[unsafe(no_mangle)]
pub extern "C" fn renderer_version() -> u32 {
    1
}
#[unsafe(no_mangle)]
pub extern "C" fn render_allocate(len: usize) -> *mut u8 {
    if len == 0 || len > MAX_BYTES * 2 {
        return std::ptr::null_mut();
    }
    Box::into_raw(vec![0u8; len].into_boxed_slice()) as *mut u8
}
/// # Safety
/// ptr/len must be the live buffer returned by render_allocate. Result packs
/// the output length (high 32 bits) and pointer (low 32 bits), for wasm32.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn render_scene(ptr: *const u8, len: usize) -> u64 {
    if ptr.is_null() || len == 0 || len > MAX_BYTES {
        return 0;
    }
    let input = unsafe { std::slice::from_raw_parts(ptr, len) };
    let Some(svg) = compose(input) else {
        return 0;
    };
    let bytes = svg.into_bytes().into_boxed_slice();
    let length = bytes.len() as u64;
    let output = Box::into_raw(bytes) as *mut u8;
    (length << 32) | output as u64
}
/// # Safety
/// Release once with the exact original allocation pointer and length.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn render_release(ptr: *mut u8, len: usize) {
    if !ptr.is_null() && len > 0 && len <= MAX_BYTES * 2 {
        unsafe {
            drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, len)));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn header(assets: u32, commands: u32) -> Vec<u8> {
        let mut b = b"RSVG".to_vec();
        b.extend(1u32.to_le_bytes());
        b.extend(578f64.to_le_bytes());
        b.extend(782f64.to_le_bytes());
        b.extend(assets.to_le_bytes());
        b.extend(commands.to_le_bytes());
        b
    }
    fn text(b: &mut Vec<u8>, value: &str) {
        b.extend((value.len() as u32).to_le_bytes());
        b.extend(value.as_bytes());
    }
    #[test]
    fn text_is_vector_and_xml_is_escaped() {
        let mut b = header(0, 1);
        b.push(3);
        for v in [10f64, 20.0, 12.0, 0.5] {
            b.extend(v.to_le_bytes());
        }
        b.push(0);
        for s in ["A<&\"B", "Arial", "700", "#112233"] {
            text(&mut b, s);
        }
        let svg = compose(&b).unwrap();
        assert!(svg.contains("A&lt;&amp;&quot;B"));
        assert!(svg.contains("<text"));
        assert!(!svg.contains("foreignObject"));
    }
    #[test]
    fn invalid_clips_and_external_resources_are_rejected() {
        let mut b = header(0, 1);
        b.push(6);
        assert!(compose(&b).is_none());
        let mut b = header(1, 0);
        b.extend(20f64.to_le_bytes());
        b.extend(20f64.to_le_bytes());
        text(&mut b, "https://x.test/a.png");
        assert!(compose(&b).is_none());
        assert!(compose(b"invalid").is_none());
        for n in 0..32 {
            assert!(compose(&header(0, 0)[..n]).is_none());
        }
    }
}
