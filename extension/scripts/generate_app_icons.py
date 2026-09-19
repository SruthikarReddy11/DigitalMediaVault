import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_vault_logo(size=512):
    # Supersample at 2x for ultra smooth anti-aliasing
    scale = 2
    render_size = size * scale
    img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    
    # Coordinate system: normalized 0..120 matching the SVG viewBox
    def to_px(x, y):
        px = (x / 120.0) * render_size
        py = (y / 120.0) * render_size
        return (px, py)

    # 1. Multi-Layer Ambient Back-Glow
    glow_img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    cx, cy = render_size / 2, render_size * (62 / 120)
    glow_r = render_size * 0.42
    
    # Render radial glow with cyber cyan and purple
    for r_step in range(int(glow_r), 0, -int(4 * scale)):
        ratio = r_step / glow_r
        # Blend from cyan to purple to blue
        alpha = int((1.0 - ratio) * 70)
        r_col = int(30 + 130 * ratio)
        g_col = int(180 - 100 * ratio)
        b_col = int(240 + 15 * (1 - ratio))
        glow_draw.ellipse(
            [cx - r_step, cy - r_step, cx + r_step, cy + r_step],
            fill=(r_col, g_col, b_col, alpha)
        )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=18 * scale))
    img = Image.alpha_composite(img, glow_img)

    # Draw on main canvas
    draw = ImageDraw.Draw(img)

    # Helper for polygon gradient interpolation
    def draw_linear_gradient_poly(poly_pts, p_start, p_end, color_stops):
        # Create mask
        mask = Image.new("L", (render_size, render_size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.polygon([to_px(x, y) for x, y in poly_pts], fill=255)

        # Create gradient buffer
        grad = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
        
        # Bounding box of poly
        pts_px = [to_px(x, y) for x, y in poly_pts]
        min_x = max(0, int(min(p[0] for p in pts_px)))
        max_x = min(render_size, int(max(p[0] for p in pts_px)) + 1)
        min_y = max(0, int(min(p[1] for p in pts_px)))
        max_y = min(render_size, int(max(p[1] for p in pts_px)) + 1)

        p1x, p1y = to_px(*p_start)
        p2x, p2y = to_px(*p_end)
        vx = p2x - p1x
        vy = p2y - p1y
        v_len_sq = vx * vx + vy * vy
        if v_len_sq == 0:
            v_len_sq = 1

        grad_arr = np.zeros((max_y - min_y, max_x - min_x, 4), dtype=np.uint8)
        
        # Coordinates grid
        y_coords, x_coords = np.mgrid[min_y:max_y, min_x:max_x]
        proj = ((x_coords - p1x) * vx + (y_coords - p1y) * vy) / v_len_sq
        proj = np.clip(proj, 0.0, 1.0)

        # Interpolate color stops
        # stops: list of (t, (r, g, b, a))
        for i in range(len(color_stops) - 1):
            t0, c0 = color_stops[i]
            t1, c1 = color_stops[i + 1]
            seg_mask = (proj >= t0) & (proj <= t1)
            t_rel = (proj - t0) / (t1 - t0 + 1e-9)
            
            for ch in range(4):
                val = c0[ch] + (c1[ch] - c0[ch]) * t_rel
                grad_arr[seg_mask, ch] = val[seg_mask].astype(np.uint8)

        grad_tile = Image.fromarray(grad_arr, 'RGBA')
        grad.paste(grad_tile, (min_x, min_y))
        grad.putalpha(mask)
        nonlocal img
        img = Image.alpha_composite(img, grad)

    def to_r(r_120):
        return max(1.0, (r_120 / 120.0) * render_size)

    # 2. Outer Gyroscopic Orbital Ring
    ring_img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring_img)
    ring_cx, ring_cy = to_px(60, 60)
    rx, ry = (54 / 120.0) * render_size, (24 / 120.0) * render_size
    ring_draw.ellipse(
        [ring_cx - rx, ring_cy - ry, ring_cx + rx, ring_cy + ry],
        outline=(56, 189, 248, 170),
        width=max(1, int(to_r(1.2)))
    )
    # Satellite nodes
    sat1_x, sat1_y = to_px(114, 60)
    sat1_r = to_r(2.5)
    ring_draw.ellipse([sat1_x - sat1_r, sat1_y - sat1_r, sat1_x + sat1_r, sat1_y + sat1_r], fill=(56, 189, 248, 255))
    
    sat2_x, sat2_y = to_px(6, 60)
    sat2_r = to_r(2.0)
    ring_draw.ellipse([sat2_x - sat2_r, sat2_y - sat2_r, sat2_x + sat2_r, sat2_y + sat2_r], fill=(168, 85, 247, 255))
    img = Image.alpha_composite(img, ring_img)

    # 3. Multi-Faceted 3D Isometric Vault Geometry
    # Left Face
    left_poly = [(18, 38), (60, 62), (60, 106), (18, 82)]
    left_stops = [
        (0.0, (2, 132, 199, 255)),    # #0284c7
        (0.45, (3, 105, 161, 255)),   # #0369a1
        (0.85, (8, 47, 73, 255)),     # #082f49
        (1.0, (3, 7, 18, 255)),       # #030712
    ]
    draw_linear_gradient_poly(left_poly, (18, 38), (60, 106), left_stops)

    # Right Face
    right_poly = [(60, 62), (102, 38), (102, 82), (60, 106)]
    right_stops = [
        (0.0, (99, 102, 241, 255)),   # #6366f1
        (0.45, (124, 58, 237, 255)),  # #7c3aed
        (0.80, (76, 29, 149, 255)),   # #4c1d95
        (1.0, (15, 23, 42, 255)),     # #0f172a
    ]
    draw_linear_gradient_poly(right_poly, (102, 38), (60, 106), right_stops)

    # Top Face
    top_poly = [(60, 14), (102, 38), (60, 62), (18, 38)]
    top_stops = [
        (0.0, (125, 211, 252, 255)),  # #7dd3fc
        (0.35, (56, 189, 248, 255)),  # #38bdf8
        (0.70, (6, 182, 212, 255)),   # #06b6d4
        (1.0, (99, 102, 241, 255)),   # #6366f1
    ]
    draw_linear_gradient_poly(top_poly, (60, 14), (60, 62), top_stops)

    # Circuit Tracks & Details
    overlay = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    # Left face circuit tracks
    c_line_w = max(1, int(to_r(1.2)))
    left_tracks = [
        ((32, 58), (48, 67)),
        ((32, 76), (54, 88)),
        ((40, 46), (40, 82))
    ]
    for p1, p2 in left_tracks:
        overlay_draw.line([to_px(*p1), to_px(*p2)], fill=(56, 189, 248, 210), width=c_line_w)

    # Glowing Cyan circuit nodes
    node_r = to_r(1.6)
    for nx, ny in [(32, 58), (48, 67), (32, 76), (54, 88)]:
        px, py = to_px(nx, ny)
        overlay_draw.ellipse([px - node_r, py - node_r, px + node_r, py + node_r], fill=(165, 243, 252, 255))

    # Right face circuit tracks
    right_tracks = [
        ((88, 58), (72, 67)),
        ((88, 76), (66, 88)),
        ((80, 46), (80, 82))
    ]
    for p1, p2 in right_tracks:
        overlay_draw.line([to_px(*p1), to_px(*p2)], fill=(192, 132, 252, 210), width=c_line_w)

    for nx, ny in [(88, 58), (72, 67), (88, 76), (66, 88)]:
        px, py = to_px(nx, ny)
        overlay_draw.ellipse([px - node_r, py - node_r, px + node_r, py + node_r], fill=(233, 213, 255, 255))

    # Specular Edge Rims
    rim_w = max(1, int(to_r(1.4)))
    # Top rim
    overlay_draw.line([to_px(60, 14), to_px(102, 38)], fill=(255, 255, 255, 240), width=rim_w)
    overlay_draw.line([to_px(60, 14), to_px(18, 38)], fill=(255, 255, 255, 240), width=rim_w)
    overlay_draw.line([to_px(18, 38), to_px(60, 62)], fill=(165, 243, 252, 220), width=rim_w)
    overlay_draw.line([to_px(102, 38), to_px(60, 62)], fill=(192, 132, 252, 220), width=rim_w)
    # Side rims
    overlay_draw.line([to_px(18, 38), to_px(18, 82)], fill=(56, 189, 248, 190), width=rim_w)
    overlay_draw.line([to_px(102, 38), to_px(102, 82)], fill=(192, 132, 252, 190), width=rim_w)
    overlay_draw.line([to_px(18, 82), to_px(60, 106)], fill=(56, 189, 248, 170), width=rim_w)
    overlay_draw.line([to_px(102, 82), to_px(60, 106)], fill=(192, 132, 252, 170), width=rim_w)
    # Center vertical seam
    overlay_draw.line([to_px(60, 62), to_px(60, 106)], fill=(255, 255, 255, 180), width=max(1, int(to_r(1.2))))

    # Inner Top Chamfer Highlight
    chamfer_pts = [to_px(60, 21), to_px(92, 38), to_px(60, 55), to_px(28, 38)]
    overlay_draw.polygon(chamfer_pts, outline=(255, 255, 255, 120), width=max(1, int(to_r(0.8))))

    # Top Glass Glaze Highlight
    glaze_pts = [to_px(40, 26), to_px(80, 26), to_px(70, 33), to_px(30, 33)]
    overlay_draw.polygon(glaze_pts, fill=(255, 255, 255, 90))

    # 4. Holographic Quantum Singularity / Keyhole Core
    diamond_bezel = [to_px(60, 46), to_px(74, 54), to_px(60, 69), to_px(46, 54)]
    overlay_draw.polygon(diamond_bezel, fill=(3, 7, 18, 240), outline=(103, 232, 249, 255), width=max(1, int(to_r(1.4))))
    
    # Keyhole glyph
    key_cx, key_cy = to_px(60, 54)
    k_r = to_r(3.2)
    overlay_draw.ellipse([key_cx - k_r, key_cy - k_r, key_cx + k_r, key_cy + k_r], fill=(255, 255, 255, 255))
    k_inner = to_r(1.6)
    overlay_draw.ellipse([key_cx - k_inner, key_cy - k_inner, key_cx + k_inner, key_cy + k_inner], fill=(2, 132, 199, 255))
    overlay_draw.line([to_px(60, 57.5), to_px(60, 63.5)], fill=(255, 255, 255, 255), width=max(1, int(to_r(1.6))))
    overlay_draw.line([to_px(58, 61), to_px(62, 61)], fill=(255, 255, 255, 255), width=max(1, int(to_r(1.6))))

    # 5. Specular Lens Flare Stars
    # Top star
    st_x, st_y = to_px(60, 14)
    s_r = to_r(2.2)
    overlay_draw.ellipse([st_x - s_r, st_y - s_r, st_x + s_r, st_y + s_r], fill=(255, 255, 255, 255))
    overlay_draw.line([(st_x - to_r(6), st_y), (st_x + to_r(6), st_y)], fill=(255, 255, 255, 240), width=max(1, int(to_r(0.8))))
    overlay_draw.line([(st_x, st_y - to_r(6)), (st_x, st_y + to_r(6))], fill=(255, 255, 255, 240), width=max(1, int(to_r(0.8))))

    # Right star
    sr_x, sr_y = to_px(102, 38)
    sr_r = to_r(1.8)
    overlay_draw.ellipse([sr_x - sr_r, sr_y - sr_r, sr_x + sr_r, sr_y + sr_r], fill=(165, 243, 252, 255))
    overlay_draw.line([(sr_x - to_r(4), sr_y), (sr_x + to_r(4), sr_y)], fill=(165, 243, 252, 220), width=max(1, int(to_r(0.7))))
    overlay_draw.line([(sr_x, sr_y - to_r(4)), (sr_x, sr_y + to_r(4))], fill=(165, 243, 252, 220), width=max(1, int(to_r(0.7))))

    # Left star
    sl_x, sl_y = to_px(18, 38)
    overlay_draw.ellipse([sl_x - sr_r, sl_y - sr_r, sl_x + sr_r, sl_y + sr_r], fill=(165, 243, 252, 255))
    overlay_draw.line([(sl_x - to_r(4), sl_y), (sl_x + to_r(4), sl_y)], fill=(165, 243, 252, 220), width=max(1, int(to_r(0.7))))
    overlay_draw.line([(sl_x, sl_y - to_r(4)), (sl_x, sl_y + to_r(4))], fill=(165, 243, 252, 220), width=max(1, int(to_r(0.7))))

    # Bottom dot
    sb_x, sb_y = to_px(60, 106)
    sb_r = to_r(2.2)
    overlay_draw.ellipse([sb_x - sb_r, sb_y - sb_r, sb_x + sb_r, sb_y + sb_r], fill=(168, 85, 247, 255))

    img = Image.alpha_composite(img, overlay)

    # Downsample using high quality Lanczos resampling
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ext_dir = os.path.abspath(os.path.join(script_dir, ".."))
    project_root = os.path.abspath(os.path.join(ext_dir, ".."))
    ext_icons_dir = os.path.join(ext_dir, "icons")
    ext_dist_icons_dir = os.path.join(ext_dir, "dist", "icons")
    frontend_public = os.path.join(project_root, "frontend", "public")

    os.makedirs(ext_icons_dir, exist_ok=True)
    os.makedirs(ext_dist_icons_dir, exist_ok=True)
    os.makedirs(frontend_public, exist_ok=True)

    sizes = [16, 48, 128, 512]
    for s in sizes:
        print(f"Generating VaultXMedia 3D emblem icon {s}x{s}...")
        icon = create_vault_logo(s)
        
        if s in [16, 48, 128]:
            p1 = os.path.join(ext_icons_dir, f"icon{s}.png")
            p2 = os.path.join(ext_dist_icons_dir, f"icon{s}.png")
            icon.save(p1, "PNG")
            icon.save(p2, "PNG")
            print(f"Saved: {p1}")
            print(f"Saved: {p2}")
        
        if s == 128:
            fav_png = os.path.join(frontend_public, "favicon.png")
            icon.save(fav_png, "PNG")
            print(f"Saved: {fav_png}")
        if s == 512:
            pwa_512 = os.path.join(frontend_public, "icon-512.png")
            icon.save(pwa_512, "PNG")
            print(f"Saved: {pwa_512}")

    svg_content = '''<svg viewBox="0 0 120 120" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topFaceGrad3D" x1="60" y1="14" x2="60" y2="62" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7dd3fc" />
      <stop offset="35%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="leftFaceGrad3D" x1="18" y1="38" x2="60" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="45%" stop-color="#0369a1" />
      <stop offset="85%" stop-color="#082f49" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="rightFaceGrad3D" x1="102" y1="38" x2="60" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="45%" stop-color="#7c3aed" />
      <stop offset="80%" stop-color="#4c1d95" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <radialGradient id="quantumBloom" cx="60" cy="62" r="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#a5f3fc" stop-opacity="1" />
      <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.85" />
      <stop offset="55%" stop-color="#3b82f6" stop-opacity="0.45" />
      <stop offset="85%" stop-color="#6366f1" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#030712" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="specularRim3D" x1="18" y1="14" x2="102" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="25%" stop-color="#a5f3fc" stop-opacity="0.8" />
      <stop offset="55%" stop-color="#38bdf8" stop-opacity="0.6" />
      <stop offset="85%" stop-color="#c084fc" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2" />
    </linearGradient>
    <linearGradient id="chamferLight" x1="60" y1="14" x2="60" y2="106" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="orbitRingGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.7" />
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#c084fc" stop-opacity="0.6" />
    </linearGradient>
  </defs>
  <g opacity="0.75">
    <ellipse cx="60" cy="60" rx="54" ry="24" fill="none" stroke="url(#orbitRingGrad)" stroke-width="1.2" stroke-dasharray="4 6 1 6" />
    <circle cx="114" cy="60" r="2.5" fill="#38bdf8" />
    <circle cx="6" cy="60" r="2" fill="#a855f7" />
  </g>
  <g opacity="0.6">
    <ellipse cx="60" cy="60" rx="24" ry="50" fill="none" stroke="#67e8f9" stroke-width="1" stroke-dasharray="3 5" transform="rotate(25 60 60)" />
    <circle cx="60" cy="10" r="2" fill="#ffffff" transform="rotate(25 60 60)" />
  </g>
  <circle cx="60" cy="62" r="30" fill="url(#quantumBloom)" />
  <path d="M18 38L60 62V106L18 82V38Z" fill="url(#leftFaceGrad3D)" stroke="url(#specularRim3D)" stroke-width="1.5" stroke-linejoin="round" />
  <g opacity="0.8">
    <path d="M32 58L48 67M32 76L54 88M40 46L40 82" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round" />
    <circle cx="32" cy="58" r="1.8" fill="#a5f3fc" />
    <circle cx="48" cy="67" r="1.8" fill="#38bdf8" />
    <circle cx="32" cy="76" r="1.8" fill="#a5f3fc" />
    <circle cx="54" cy="88" r="1.8" fill="#38bdf8" />
  </g>
  <path d="M60 62L102 38V82L60 106V62Z" fill="url(#rightFaceGrad3D)" stroke="url(#specularRim3D)" stroke-width="1.5" stroke-linejoin="round" />
  <g opacity="0.8">
    <path d="M88 58L72 67M88 76L66 88M80 46L80 82" stroke="#c084fc" stroke-width="1.2" stroke-linecap="round" />
    <circle cx="88" cy="58" r="1.8" fill="#e9d5ff" />
    <circle cx="72" cy="67" r="1.8" fill="#c084fc" />
    <circle cx="88" cy="76" r="1.8" fill="#e9d5ff" />
    <circle cx="66" cy="88" r="1.8" fill="#c084fc" />
  </g>
  <path d="M60 14L102 38L60 62L18 38L60 14Z" fill="url(#topFaceGrad3D)" stroke="url(#specularRim3D)" stroke-width="1.6" stroke-linejoin="round" />
  <path d="M60 21L92 38L60 55L28 38L60 21Z" fill="none" stroke="url(#chamferLight)" stroke-width="1" stroke-opacity="0.6" />
  <path d="M40 26L80 26L70 33L30 33L40 26Z" fill="#ffffff" fill-opacity="0.4" />
  <path d="M60 62V106" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round" />
  <path d="M60 46L74 54L60 69L46 54L60 46Z" fill="#030712" fill-opacity="0.95" stroke="#67e8f9" stroke-width="1.6" stroke-linejoin="round" />
  <circle cx="60" cy="55" r="5" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2" />
  <circle cx="60" cy="54" r="3.2" fill="#ffffff" />
  <circle cx="60" cy="54" r="1.6" fill="#0284c7" />
  <path d="M60 57.5V63.5M58 61H62" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" />
  <circle cx="60" cy="14" r="2.2" fill="#ffffff" />
  <path d="M54 14H66M60 8V20" stroke="#ffffff" stroke-width="1" stroke-linecap="round" />
  <circle cx="102" cy="38" r="2" fill="#a5f3fc" />
  <circle cx="18" cy="38" r="2" fill="#a5f3fc" />
  <circle cx="60" cy="106" r="2.2" fill="#a855f7" />
</svg>'''

    with open(os.path.join(frontend_public, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    with open(os.path.join(ext_icons_dir, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    with open(os.path.join(ext_dist_icons_dir, "icon.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("SVG logos saved to frontend and extension!")
    print("All icons generated successfully!")
