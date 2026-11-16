import { spawnSync } from 'node:child_process'
import { mkdirSync, copyFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const crate = path.join(root, 'rust/layout-engine')
const result = spawnSync(process.env.CARGO || 'cargo', ['build', '--manifest-path', path.join(crate, 'Cargo.toml'), '--target-dir', path.join(crate, 'target'), '--release', '--target', 'wasm32-unknown-unknown', '--locked'], { cwd: root, stdio: 'inherit' })
if (result.error) { console.error('Cargo não encontrado. Instale Rust e o target wasm32-unknown-unknown; veja docs/RUST.md.'); process.exit(1) }
if (result.status !== 0) process.exit(result.status || 1)
const output = path.join(root, 'src/generated/layout_engine.wasm')
mkdirSync(path.dirname(output), { recursive: true })
copyFileSync(path.join(crate, 'target/wasm32-unknown-unknown/release/panfletos_layout.wasm'), output)
console.log(`Rust/WebAssembly compilado: ${statSync(output).size} bytes`)
