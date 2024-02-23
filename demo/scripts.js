function $(id) {
  return document.getElementById(id);
}

async function processImage(e) {
  e.preventDefault();

  let formData = new FormData($("upload-form"));

  const saveDirectory = "demo";
  // input parameters
  const resizeX = formData.get("resizeX");
  const resizeY = formData.get("resizeY");
  const image = formData.get("image");

  if (!image.name) {
    return alert("Upload an image to process");
  }

  let queryString = `?saveDirectory=${saveDirectory}&resizeX=${resizeX}&resizeY=${resizeY}`;
  let requestPayload = new FormData();

  requestPayload.append("image", image);

  // make post request
  const response = await fetch(
    `https://5gbwhcjt24tsfqsvrzdxgnc4oq0ocquo.lambda-url.us-east-1.on.aws/${queryString}`,
    {
      method: "POST",
      body: requestPayload,
    }
  );

  const data = await response.json();

  if (response.status === 400) {
    return alert(data);
  }

  const url = data.url;

  // display url on screen and as img src
  $("image-url").innerHTML = `url: ${url}`;
  $("image-src").setAttribute("src", url);
}
