"""Replace create_adapter with a real multiview model; never execute job-supplied code."""
from PIL import Image, ImageDraw, ImageOps


class TestAdapter:
    name = "test-preview"
    uses_gpu = False

    def generate(self, artwork, job):
        """Yield (zero-based index, RGBA PIL image). One output per requested view.

        Real adapters load weights once in __init__, consume views/tilt/size/mode,
        and yield images in angle order. The worker owns paths, progress and errors.
        This adapter ONLY labels copies: it does not infer geometry or hidden sides.
        """
        with Image.open(artwork) as source:
            base = ImageOps.contain(source.convert("RGBA"), (job["size"], job["size"]))
        for index in range(job["views"]):
            canvas = Image.new("RGBA", (job["size"], job["size"]), (0, 0, 0, 0))
            canvas.alpha_composite(base, ((canvas.width-base.width)//2, (canvas.height-base.height)//2))
            draw = ImageDraw.Draw(canvas)
            draw.rectangle((0, 0, canvas.width, 32), fill=(0, 0, 0, 220))
            draw.text((8, 8), f"TEST ONLY {index+1}/{job['views']} | {index*360/job['views']:.0f} deg | tilt {job['tilt']}", fill="white")
            yield index, canvas


def create_adapter(mode):
    if mode != "test-preview":
        raise ValueError("No real AI model installed. Choose test-preview.")
    return TestAdapter()
