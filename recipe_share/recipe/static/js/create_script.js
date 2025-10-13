// -------------------------------------------------------------
const SUPABASE_URL = "https://jfzojphxhgpejvffefvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmem9qcGh4aGdwZWp2ZmZlZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNDU0MDUsImV4cCI6MjA3NDYyMTQwNX0.CDDc3Zja_faSnao3sEMXP_HyFolMMVIhadEsDC5ZS3c";
// -------------------------------------------------------------

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elements
const cancelBtn = document.getElementById("cancelBtn");
const submitBtn = document.getElementById("submitBtn");
const chooseFileBtn = document.querySelector(".choose-file-btn");
const fileInput = document.getElementById("fileInput");
const addIngredientBtn = document.getElementById("addIngredientBtn");
const ingredientsContainer = document.getElementById("ingredientsContainer");
const addStepBtn = document.getElementById("addStepBtn");
const instructionsContainer = document.getElementById("instructionsContainer");

// Tabs
const tabBtns = document.querySelectorAll(".tab-btn");
const uploadTab = document.getElementById("uploadTab");
const urlTab = document.getElementById("urlTab");
const stockTab = document.getElementById("stockTab");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const tabName = btn.dataset.tab;
    uploadTab.classList.remove("active");
    urlTab.classList.remove("active");
    stockTab.classList.remove("active");

    if (tabName === "upload") uploadTab.classList.add("active");
    if (tabName === "url") urlTab.classList.add("active");
    if (tabName === "stock") stockTab.classList.add("active");
  });
});

// Choose file
if (chooseFileBtn) {
  chooseFileBtn.addEventListener("click", () => {
    fileInput.click();
  });
}

// Add ingredient
addIngredientBtn.addEventListener("click", () => {
  const count = ingredientsContainer.children.length + 1;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "ingredient-input";
  input.placeholder = `Ingredient ${count}`;
  ingredientsContainer.appendChild(input);
});

// Add step
addStepBtn.addEventListener("click", () => {
  const count = instructionsContainer.children.length + 1;
  const textarea = document.createElement("textarea");
  textarea.className = "instruction-input";
  textarea.placeholder = `Step ${count}`;
  instructionsContainer.appendChild(textarea);
});

// Handle file upload
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from("recipe-images") // ← bucket name
      .upload(filePath, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;


    document.getElementById("imageUrl").value = imageUrl;

    alert("✅ Image uploaded successfully!");
    console.log("Image URL:", imageUrl);
  } catch (error) {
    console.error("Error uploading file:", error);
    alert("❌ Failed to upload image: " + error.message);
  }
});

// Cancel
cancelBtn.addEventListener("click", () => {
  if (
    confirm("Are you sure you want to cancel? All unsaved changes will be lost.")
  ) {
    window.location.href = "/main/";
  }
});

// Submit recipe
submitBtn.addEventListener("click", async () => {
  try {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value.trim();
    const cuisine = document.getElementById("cuisine").value.trim();
    const cookTime = document.getElementById("cookTime").value.trim();
    const imageUrl = document.getElementById("imageUrl").value.trim();

    const ingredientInputs = document.querySelectorAll(".ingredient-input");
    const ingredients = Array.from(ingredientInputs)
      .map((input) => input.value.trim())
      .filter((val) => val !== "");

    const instructionInputs = document.querySelectorAll(".instruction-input");
    const instructions = Array.from(instructionInputs)
      .map((input, index) => `${index + 1}. ${input.value.trim()}`)
      .filter((val) => !val.match(/^\d+\.\s*$/))
      .join("\n\n");

    if (!title) {
      alert("Please enter a recipe title");
      document.getElementById("title").focus();
      return;
    }
    if (!description) {
      alert("Please enter a description");
      document.getElementById("description").focus();
      return;
    }
    if (ingredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }
    if (!instructions) {
      alert("Please add at least one instruction step");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Adding Recipe...";

    // FIXED: Get email instead of username
    const userEmail = window.CURRENT_EMAIL || window.CURRENT_USERNAME;

    if (!userEmail) {
      alert("⚠️ Could not find logged-in user email.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Recipe";
      return;
    }

    console.log("Looking up user by email:", userEmail);

    // FIXED: Query by email instead of username
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (userError || !userRow) {
      console.error("Error fetching user ID:", userError);
      alert("Error: could not find user ID for this email.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Recipe";
      return;
    }

    const authorId = userRow.id;
    console.log("Found user ID:", authorId);

    // Debug log
    console.log("🚀 Submitting recipe with data:", {
      author_id: authorId,
      title,
      description,
      ingredients,
      instructions,
      cook_time: cookTime ? parseInt(cookTime) : null,
      cuisine: cuisine || null,
      category: category || null,
      cover_photo_url: imageUrl || null,
    });

    // Insert recipe
    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          author_id: authorId,
          title,
          description,
          ingredients,
          instructions,
          cook_time: cookTime ? parseInt(cookTime) : null,
          cuisine: cuisine || null,
          category: category || null,
          cover_photo_url: imageUrl || null,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Error inserting recipe:", error);
      alert("Error creating recipe: " + error.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Recipe";
      return;
    }

    console.log("🎉 Recipe created successfully:", data);
    alert("Recipe created successfully!");

    resetForm();
    await loadRecipes();

    submitBtn.disabled = false;
    submitBtn.textContent = "Add Recipe";
  } catch (error) {
    console.error("🔥 Unexpected error details:", error);
    alert("An unexpected error occurred: " + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Recipe";
  }
});

function resetForm() {
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("category").value = "";
  document.getElementById("cuisine").value = "";
  document.getElementById("cookTime").value = "";
  document.getElementById("imageUrl").value = "";

  ingredientsContainer.innerHTML = `
        <input type="text" class="ingredient-input" placeholder="Ingredient 1">
    `;

  instructionsContainer.innerHTML = `
        <textarea class="instruction-input" placeholder="Step 1"></textarea>
    `;

  fileInput.value = "";
  console.log("Form reset complete");
}

// Load recipes for current user
async function loadRecipes() {
  const recipeGrid = document.getElementById("recipeGrid");

  try {
    recipeGrid.innerHTML = '<div class="loading">Loading recipes...</div>';

    const currentUserId = await getCurrentUserId();

    if (!currentUserId) {
      recipeGrid.innerHTML =
        "<div class='error'>Please log in to view your recipes.</div>";
      return;
    }

    console.log("Current user ID:", currentUserId);

    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(
        `
        *,
        users!recipes_author_id_fkey (
          full_name,
          email
        )
      `
      )
      .eq("author_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading recipes:", error);
      recipeGrid.innerHTML = `<div class="error">Error loading recipes: ${error.message}</div>`;
      return;
    }

    console.log("Loaded recipes:", recipes);
    displayRecipes(recipes);
  } catch (error) {
    console.error("Unexpected error loading recipes:", error);
    recipeGrid.innerHTML = `<div class="error">Unexpected error: ${error.message}</div>`;
  }
}

function displayRecipes(recipes) {
  const recipeGrid = document.getElementById("recipeGrid");
  if (!recipes || recipes.length === 0) {
    recipeGrid.innerHTML = "<p>No recipes found. Add your first recipe!</p>";
    return;
  }

  recipeGrid.innerHTML = "";

  recipes.forEach((recipe) => {
    const div = document.createElement("div");
    div.className = "recipe-card";

    div.innerHTML = `
      <img src="${recipe.cover_photo_url || "/static/default_recipe.jpg"}" alt="${recipe.title}" />
      <h3>${recipe.title}</h3>
      <p>${recipe.description}</p>
      <p><strong>Category:</strong> ${recipe.category || "N/A"}</p>
      <p><strong>Cuisine:</strong> ${recipe.cuisine || "N/A"}</p>
      <p><strong>Cook Time:</strong> ${
        recipe.cook_time ? recipe.cook_time + " mins" : "N/A"
      }</p>
    `;

    recipeGrid.appendChild(div);
  });
}

// FIXED: Get current user ID by email
async function getCurrentUserId() {
  try {
    const userEmail = window.CURRENT_EMAIL || window.CURRENT_USERNAME;

    if (!userEmail) {
      console.error("No user email found");
      return null;
    }

    console.log("Looking up user ID for email:", userEmail);

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user ID:", error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error("Error in getCurrentUserId:", error);
    return null;
  }
}

// Load recipes on page load
window.addEventListener("DOMContentLoaded", () => {
  loadRecipes();
});