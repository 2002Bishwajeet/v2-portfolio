from PIL import Image, ImageDraw, ImageFont
import os

def create_og_image():
    # Dimensions
    width = 1200
    height = 630

    # Colors from styles.css (Dark Mode)
    bg_color = "#0c0704"       # --bg-color
    text_color = "#e6cba8"     # --highlight-color (used for H1)
    accent_color = "#783d11"   # --accent-color (used for H2)

    # Create image
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Fonts
    # We downloaded PressStart2P-Regular.ttf to public/
    font_path = "public/PressStart2P-Regular.ttf"

    try:
        title_font = ImageFont.truetype(font_path, 60)
        subtitle_font = ImageFont.truetype(font_path, 35)
        small_font = ImageFont.truetype(font_path, 20)
    except Exception as e:
        print(f"Could not load font: {e}. Using default.")
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Text content
    title = "Bishwajeet Parhi"
    subtitle = "Frontend Architect"
    footer_text = "about.bishwajeetparhi.dev"

    # Calculate positions (centering)
    # PIL getbbox returns (left, top, right, bottom)

    # Title
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]

    # Subtitle
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_w = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_h = subtitle_bbox[3] - subtitle_bbox[1]

    # Footer
    footer_bbox = draw.textbbox((0, 0), footer_text, font=small_font)
    footer_w = footer_bbox[2] - footer_bbox[0]

    # Center positions
    center_x = width // 2
    center_y = height // 2

    # Draw Title (slightly above center)
    draw.text((center_x - title_w // 2, center_y - title_h - 20), title, font=title_font, fill=text_color)

    # Draw Subtitle (slightly below center)
    draw.text((center_x - subtitle_w // 2, center_y + 20), subtitle, font=subtitle_font, fill=accent_color)

    # Draw footer (at bottom)
    draw.text((center_x - footer_w // 2, height - 60), footer_text, font=small_font, fill=accent_color)

    # Add a border or some pixel art element?
    # Let's add a simple border
    border_width = 10
    draw.rectangle([(border_width, border_width), (width - border_width, height - border_width)], outline=accent_color, width=4)

    # Save
    output_path = "public/og-image.png"
    img.save(output_path)
    print(f"OG Image saved to {output_path}")

if __name__ == "__main__":
    create_og_image()
