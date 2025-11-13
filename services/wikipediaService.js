export async function fetchWikipediaSummary(topic) {
  const encodedTopic = encodeURIComponent(topic);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Topic "${topic}" not found on Wikipedia`);
    }
    throw new Error(`Wikipedia API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    title: data.title,
    extract: data.extract,
    content_urls: data.content_urls
  };
}
