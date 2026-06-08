export async function runFfmpeg(args: string[]): Promise<void> {
  const proc = Bun.spawn(["ffmpeg", ...args], { stdout: "pipe", stderr: "pipe" });
  const code = await proc.exited;
  if (code !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(`ffmpeg failed (${code}): ${err.slice(-800)}`);
  }
}

export async function ffprobeDuration(path: string): Promise<number> {
  const proc = Bun.spawn(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration",
     "-of", "default=nw=1:nk=1", path],
    { stdout: "pipe", stderr: "pipe" },
  );
  await proc.exited;
  return parseFloat((await new Response(proc.stdout).text()).trim());
}

export async function ffprobeHasVideo(path: string): Promise<boolean> {
  const proc = Bun.spawn(
    ["ffprobe", "-v", "error", "-select_streams", "v",
     "-show_entries", "stream=codec_type", "-of", "csv=p=0", path],
    { stdout: "pipe", stderr: "pipe" },
  );
  await proc.exited;
  return (await new Response(proc.stdout).text()).includes("video");
}
