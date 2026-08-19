import Reveal from "./Reveal";

export default function ClipAnything() {
  return (
    <Reveal delay={100}>
      <div className="mx-auto mt-12 max-w-3xl text-center">
        <h3 className="text-2xl font-bold text-white sm:text-3xl">
          ClipAnything
        </h3>
        <p className="mt-4 text-zinc-400">
          Every other AI clipping tool only works with video podcasts.
          ClipAnything is the only AI clipping model that turns any genre —
          vlogs, gaming, sports, interviews, explainer videos — into viral
          clips in 1 click.
        </p>
        <a href="#upload" className="btn-primary mt-6 inline-flex">
          Try ClipAnything
        </a>
      </div>
    </Reveal>
  );
}
