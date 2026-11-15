// ---------- Hidden timestamp: when the form was loaded ----------
const timestamp = document.querySelector("#timestamp");
timestamp.value = new Date().toISOString();

// ---------- Membership level modals ----------
const levelLinks = document.querySelectorAll(".level-link");
const modals = document.querySelectorAll(".level-modal");

levelLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.getElementById(link.dataset.modal).showModal();
  });
});

modals.forEach((modal) => {
  modal.querySelector(".close-btn").addEventListener("click", () => modal.close());

  // A click on the backdrop (outside the dialog box) also closes it
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
});
