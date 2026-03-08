Deno.serve((_req: Request) => {
  return new Response("ok", { status: 200 });
});
