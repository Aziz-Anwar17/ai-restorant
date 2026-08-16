import UploadBox from "./UploadBox";
import ProductPreview from "./ProductPreview";
import Reveal from "./Reveal";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      {/* glow background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-[-200px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand/20 blur-[140px]" />
        <div className="absolute right-[-100px] top-[300px] h-[300px] w-[300px] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="eyebrow mb-6">#1 AI Video Clipping Tool</p>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            1 long video, 10 viral clips.
            <br />
            <span className="bg-gradient-to-r from-brand-soft via-brand to-accent bg-clip-text text-transparent">
              Create 10x faster.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 sm:text-lg">
            Dapur AI turns long videos into shorts, and publishes them to all
            social platforms in one click.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-10">
          <UploadBox />
        </Reveal>

        <Reveal delay={250}>
          <ProductPreview />
        </Reveal>
      </div>
    </section>
  );
}
