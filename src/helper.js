import fetch from "node-fetch";

// fetch remote file
export async function fetchJSONFile(urlFull) {
  const response = await fetch(urlFull);
  const body = await response.text();
  const remoteJson = JSON.parse(body);
  return remoteJson;
}
