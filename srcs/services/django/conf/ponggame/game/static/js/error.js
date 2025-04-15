
// Generic Error Page HTML template
const errorHtml = /* html */`
  <div class="box text-white">
    <h1 class="p-5 text-center">Something Went Wrong</h1>
    <div class="w-25 mx-auto">
      <div id="message" class="alert alert-danger text-center"></div>
    </div>
  </div>
`;

export function errorPage(app) {
  console.log("Error Page Loaded");
  app.innerHTML = errorHtml;
}
