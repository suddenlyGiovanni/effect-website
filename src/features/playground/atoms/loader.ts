import * as Effect from "effect/Effect";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { Loader } from "../services/loader";

const runtime = Atom.runtime(Loader.layer);

export const isLoadedAtom = runtime
  .atom(Effect.service(Loader).pipe(Effect.flatMap((loader) => loader.await)))
  .pipe(Atom.map(AsyncResult.isSuccess));
