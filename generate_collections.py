import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from rembg import remove

# Configuration
INPUT_DIR = "My cranbi final jpeg"
OUTPUT_DIR = "assets/collection_covers"
FONT_PATH = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
IMAGE_SIZE = (1080, 1080)

# Collections mapping
COLLECTIONS = {
    "SKINCARE": {
        "bg_color_1": (165, 56, 56), # Deep red (matching reference)
        "bg_color_2": (135, 46, 46),
        "products": ["mycranbi_saffron_face_gel.jpg", "cranbi_face_cream.jpg", "mycranbi_orange_facewash.jpg"],
        "text": "SKINCARE"
    },
    "HAIRCARE": {
        "bg_color_1": (118, 143, 118), # Sage green
        "bg_color_2": (98, 123, 98),
        "products": ["mycranbi_amla_and_shikakai_shampoo.jpg", "cranbi_dark_hair_oil.jpg", "mycranbi_cream_hair_serum.jpg"],
        "text": "HAIRCARE"
    },
    "SANDANYA": {
        "bg_color_1": (173, 169, 150), # Warm beige/olive
        "bg_color_2": (153, 149, 130),
        "products": ["mycranbi_saffron_sandalwood_incense_sticks.jpg", "mycranbi_saffron_moisturising_cream.jpg"],
        "text": "SANDANYA\nCOLLECTION"
    },
    "BRINGARAS": {
        "bg_color_1": (90, 115, 90), # Darker green
        "bg_color_2": (70, 95, 70),
        "products": ["cranbi_hair_shampoo.jpg", "mycranbi_green_hair_serum.jpg"],
        "text": "BRINGARAS\nCOLLECTION"
    },
    "ELADHI": {
        "bg_color_1": (148, 168, 186), # Slate blue
        "bg_color_2": (128, 148, 166),
        "products": ["mycranbi_lavender_shower_gel.jpg", "cranbi_body_lotion.jpg"],
        "text": "ELADHI\nCOLLECTION"
    },
    "ASHWARAS": {
        "bg_color_1": (189, 153, 137), # Dusty rose/copper
        "bg_color_2": (169, 133, 117),
        "products": ["cranbi_dark_amber_body_oil.jpg", "cranbi_chocolate_body_scrub.jpg"],
        "text": "ASHWARAS\nCOLLECTION"
    },
    "KUMKUMADI": {
        "bg_color_1": (155, 45, 45), # Dark brick red
        "bg_color_2": (135, 25, 25),
        "products": ["mycranbi_maa_kesar_homegrown_saffron.jpg", "mycranbi_shahi_kesar_chandan_ubtani.jpg"],
        "text": "KUMKUMADI\nCOLLECTION"
    }
}

def create_chevron_bg(width, height, color1, color2):
    """Draws a subtle chevron pattern background"""
    img = Image.new("RGBA", (width, height), color1)
    draw = ImageDraw.Draw(img)
    
    # Draw chevrons
    stripe_width = 80
    for y_offset in range(-height, height*2, stripe_width*2):
        for x in range(-width, width*2, 200):
            points = [
                (x, y_offset),
                (x + 100, y_offset - 100),
                (x + 200, y_offset),
                (x + 200, y_offset + stripe_width),
                (x + 100, y_offset - 100 + stripe_width),
                (x, y_offset + stripe_width)
            ]
            draw.polygon(points, fill=color2)
            
    # Add a soft radial gradient on top for luxury lighting effect
    gradient = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    for y in range(height):
        for x in range(width):
            dist = math.hypot(x - width/2, y - height/2)
            alpha = int(max(0, min(255, 255 * (dist / (width*0.8)))))
            gradient.putpixel((x, y), (0, 0, 0, alpha // 4))
            
    img.paste(gradient, (0, 0), gradient)
    
    # Add a soft grain
    noise = img.filter(ImageFilter.GaussianBlur(1))
    return Image.blend(img, noise, 0.2)

def remove_bg(input_path):
    """Removes background and returns RGBA Image (resizes first for speed)"""
    import io
    
    # Open and resize first for massive speedup
    img = Image.open(input_path)
    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
    
    # Convert to bytes for rembg
    byte_io = io.BytesIO()
    img.save(byte_io, format='PNG')
    input_data = byte_io.getvalue()
    
    # Process
    output_data = remove(input_data)
    return Image.open(io.BytesIO(output_data)).convert("RGBA")

def add_drop_shadow(image, offset=(0, 20), blur=20, color=(0,0,0,150)):
    """Adds a realistic drop shadow to a transparent image"""
    shadow = Image.new("RGBA", image.size, (0,0,0,0))
    shadow_draw = ImageDraw.Draw(shadow)
    
    # Create shadow mask from image alpha
    r,g,b,a = image.split()
    shadow_mask = Image.new("L", image.size, 0)
    shadow_mask.paste(a, offset)
    
    # Blur the shadow mask heavily
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(blur))
    
    # Colorize shadow
    shadow.paste(color, (0,0), shadow_mask)
    
    # Combine
    combined = Image.new("RGBA", image.size, (0,0,0,0))
    combined.paste(shadow, (0,0), shadow)
    combined.paste(image, (0,0), image)
    return combined

def generate():
    for name, data in COLLECTIONS.items():
        print(f"Generating {name}...")
        
        # 1. Create background
        bg = create_chevron_bg(IMAGE_SIZE[0], IMAGE_SIZE[1], data["bg_color_1"], data["bg_color_2"])
        
        # 2. Process products
        processed_products = []
        for prod_file in data["products"]:
            prod_path = os.path.join(INPUT_DIR, prod_file)
            if os.path.exists(prod_path):
                print(f"  Removing background for {prod_file}")
                prod_img = remove_bg(prod_path)
                
                # Crop to exact bounding box to remove excess transparency
                bbox = prod_img.getbbox()
                if bbox:
                    prod_img = prod_img.crop(bbox)
                    
                processed_products.append(prod_img)
            else:
                print(f"  Warning: {prod_file} not found!")
                
        # 3. Composite products onto background
        num_prods = len(processed_products)
        if num_prods > 0:
            # We want to arrange them from back to front, staggered
            # Scale products to reasonable height relative to background
            target_height = int(IMAGE_SIZE[1] * 0.5)
            
            # Position calculations
            center_x = IMAGE_SIZE[0] // 2
            bottom_y = int(IMAGE_SIZE[1] * 0.8) # Base alignment line
            
            # Sort by intended z-index (draw smallest/farthest first)
            # Just draw left to right or staggered
            offsets = []
            if num_prods == 1:
                offsets = [(center_x, bottom_y, 1.0)] # center
            elif num_prods == 2:
                offsets = [
                    (center_x - 150, bottom_y - 50, 0.8), # back left
                    (center_x + 100, bottom_y, 1.0) # front right
                ]
            elif num_prods >= 3:
                offsets = [
                    (center_x - 250, bottom_y - 30, 0.85), # left
                    (center_x + 250, bottom_y - 80, 0.75), # right back
                    (center_x, bottom_y, 1.0) # center front
                ]
                
            for i, p in enumerate(processed_products):
                if i < len(offsets):
                    x_pos, y_base, scale_mult = offsets[i]
                    
                    # Resize
                    p_ratio = p.width / p.height
                    new_h = int(target_height * scale_mult)
                    new_w = int(new_h * p_ratio)
                    p_resized = p.resize((new_w, new_h), Image.Resampling.LANCZOS)
                    
                    # Enhance slightly
                    enhancer = ImageEnhance.Contrast(p_resized)
                    p_resized = enhancer.enhance(1.1)
                    
                    # Add shadow
                    p_with_shadow = add_drop_shadow(p_resized)
                    
                    # Paste (centered on X, bottom aligned on Y)
                    paste_x = int(x_pos - (p_with_shadow.width / 2))
                    paste_y = int(y_base - p_with_shadow.height)
                    
                    bg.paste(p_with_shadow, (paste_x, paste_y), p_with_shadow)
                    
        # 4. Add Text overlay
        draw = ImageDraw.Draw(bg)
        try:
            font = ImageFont.truetype(FONT_PATH, 80)
        except:
            print("Font not found, using default")
            font = ImageFont.load_default()
            
        text = data["text"]
        
        # Calculate text bounding box for centering
        bbox = draw.multiline_textbbox((0,0), text, font=font, align="center")
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        
        text_x = (IMAGE_SIZE[0] - text_w) / 2
        text_y = (IMAGE_SIZE[1] - text_h) / 2
        
        # Draw soft dark shadow for text readability
        draw.multiline_text((text_x+2, text_y+2), text, font=font, fill=(0,0,0,100), align="center")
        draw.multiline_text((text_x+4, text_y+4), text, font=font, fill=(0,0,0,50), align="center")
        # Draw white text
        draw.multiline_text((text_x, text_y), text, font=font, fill=(255,255,255,255), align="center")
        
        # 5. Save
        out_filename = f"collection_{name.lower().replace(' ', '_')}.png"
        out_path = os.path.join(OUTPUT_DIR, out_filename)
        bg = bg.convert("RGB")
        bg.save(out_path, quality=95)
        print(f"  Saved {out_path}")

if __name__ == "__main__":
    generate()
