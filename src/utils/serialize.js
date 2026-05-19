function omit(obj, keys) {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

/** Batch / loop / doc / idea as stored for API responses (matches JSON export shape). */
export function toClientBatch(doc) {
  const o = doc?.toObject?.() ?? doc;
  return omit(o, ["__v", "_id", "brandId"]);
}

export function toClientLoop(doc) {
  const o = doc?.toObject?.() ?? doc;
  return omit(o, ["__v", "_id", "brandId"]);
}

export function toClientDoc(doc) {
  const o = doc?.toObject?.() ?? doc;
  return omit(o, ["__v", "_id", "brandId"]);
}

export function toClientIdea(doc) {
  const o = doc?.toObject?.() ?? doc;
  return omit(o, ["__v", "_id", "brandId"]);
}
