"""Generate precise fictional label fixtures, not purported approved artwork."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap
root = Path(__file__).resolve().parents[1]
regular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
serif = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
body = 'According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
for kind in ['match', 'abv', 'warning']:
    image = Image.new('RGB', (1200, 1050), '#fffefa')
    d = ImageDraw.Draw(image)
    d.rectangle((24,24,1176,1026), outline='#273e4b', width=3)
    def centered(text,y,size,font=regular):
        f=ImageFont.truetype(font,size)
        d.text(((1200-d.textlength(text,font=f))/2,y),text,font=f,fill='#172d38')
    centered('OLD TOM DISTILLERY',90,55,bold)
    centered('KENTUCKY',198,23,bold)
    centered('Straight Bourbon Whiskey',240,39,serif)
    d.line((220,330,980,330), fill='#8c6b3f',width=2)
    centered('45% Alc./Vol. (90 Proof)' if kind!='abv' else '40% Alc./Vol. (80 Proof)',380,37,bold)
    centered('750 mL',443,33)
    centered('Bottled by Old Tom Distillery,',532,27)
    centered('Louisville, KY',575,27)
    d.line((90,647,1110,647),fill='#b6b6ae',width=1)
    warning_head='GOVERNMENT WARNING:' if kind!='warning' else 'Government Warning:'
    d.text((80,694),warning_head,font=ImageFont.truetype(bold,25),fill='#172d38')
    full='(1) '+body
    if kind=='warning':full=full.replace('birth defects','health concerns')
    for index,line in enumerate(textwrap.wrap(full,76)):
        d.text((80,737+index*38),line,font=ImageFont.truetype(regular,24),fill='#172d38')
    image.save(root / 'public' / 'samples' / f'old-tom-{kind}.png')
