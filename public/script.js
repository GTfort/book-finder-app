document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const booksContainer = document.getElementById("booksContainer");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const noResultsMessage = document.getElementById("noResultsMessage");
  const resultsCount = document.getElementById("resultsCount");
  const resultsTitle = document.getElementById("resultsTitle");
  const pagination = document.getElementById("pagination");
  const bookModal = document.getElementById("bookModal");
  const closeModal = document.querySelector(".close-modal");
  const modalBookContent = document.getElementById("modalBookContent");
  const searchTips = document.querySelectorAll(".tip");

  // State variables
  let currentSearchQuery = "";
  let currentPage = 0;
  const booksPerPage = 12;
  let totalResults = 0;

  // Event Listeners
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  // Close modal when clicking on X
  closeModal.addEventListener("click", function () {
    bookModal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (e) {
    if (e.target === bookModal) {
      bookModal.style.display = "none";
    }
  });

  // Add click handlers to search tips
  searchTips.forEach((tip) => {
    tip.addEventListener("click", function () {
      searchInput.value = this.textContent.replace(/"/g, "");
      performSearch();
    });
  });

  // Functions
  async function performSearch() {
    const query = searchInput.value.trim();

    if (!query) {
      alert("Please enter a search term");
      return;
    }

    // Reset state
    currentSearchQuery = query;
    currentPage = 0;

    // Show loading indicator
    showLoading(true);
    clearBooksContainer();
    hideNoResults();
    hidePagination();

    // Update results title
    resultsTitle.textContent = `Search Results for "${query}"`;

    // Perform search
    await fetchBooks(query, 0);
  }

  async function fetchBooks(query, startIndex) {
    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(query)}&maxResults=${booksPerPage}&startIndex=${startIndex}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Handle no results
      if (data.totalItems === 0 || !data.books || data.books.length === 0) {
        showNoResults();
        return;
      }

      // Update results count
      totalResults = data.totalItems;
      updateResultsCount(data.books.length, startIndex);

      // Display books
      displayBooks(data.books);

      // Show pagination if there are more results
      if (totalResults > booksPerPage) {
        showPagination(startIndex);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
      showError("Failed to fetch books. Please try again.");
    } finally {
      showLoading(false);
    }
  }

  function displayBooks(books) {
    booksContainer.innerHTML = "";

    books.forEach((book) => {
      const bookCard = createBookCard(book);
      booksContainer.appendChild(bookCard);
    });

    booksContainer.style.display = "grid";
  }

  function createBookCard(book) {
    const bookCard = document.createElement("div");
    bookCard.className = "book-card";

    // Format authors
    const authors = book.authors ? book.authors.join(", ") : "Unknown Author";

    // Create rating stars
    const ratingStars = createRatingStars(book.averageRating);

    bookCard.innerHTML = `
            <div class="book-cover">
                <img src="${book.thumbnail}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/128x192?text=No+Image'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${authors}</p>
                <div class="book-details">
                    <p><strong>Published:</strong> ${formatDate(book.publishedDate)}</p>
                    <p><strong>Pages:</strong> ${book.pageCount || "N/A"}</p>
                    <p><strong>Categories:</strong> ${book.categories ? book.categories.join(", ") : "N/A"}</p>
                </div>
                <div class="book-rating">
                    ${ratingStars}
                    <span>${book.averageRating ? book.averageRating.toFixed(1) : "N/A"}</span>
                </div>
                <div class="book-actions">
                    <a href="${book.previewLink}" target="_blank" class="btn btn-preview">Preview</a>
                    <button class="btn btn-details view-details" data-book-id="${book.id}">Details</button>
                </div>
            </div>
        `;

    // Add event listener to details button
    bookCard
      .querySelector(".view-details")
      .addEventListener("click", function () {
        const bookId = this.getAttribute("data-book-id");
        showBookDetails(bookId);
      });

    return bookCard;
  }

  function createRatingStars(rating) {
    if (!rating) return "<span>No ratings</span>";

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    let starsHTML = "";

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star"></i>';
    }

    // Half star
    if (hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
  }

  async function showBookDetails(bookId) {
    try {
      showLoading(true);

      const response = await fetch(`/api/books/${bookId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const book = await response.json();
      displayBookModal(book);
    } catch (error) {
      console.error("Error fetching book details:", error);
      showError("Failed to fetch book details.");
    } finally {
      showLoading(false);
    }
  }

  function displayBookModal(book) {
    // Format authors
    const authors = book.authors ? book.authors.join(", ") : "Unknown Author";

    // Create rating stars
    const ratingStars = createRatingStars(book.averageRating);

    modalBookContent.innerHTML = `
            <div class="modal-book">
                <div class="modal-book-cover">
                    <img src="${book.thumbnail}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
                </div>
                <div class="modal-book-info">
                    <h2 class="modal-book-title">${book.title}</h2>
                    <h3 class="modal-book-author">${authors}</h3>

                    <div class="modal-book-description">
                        <p>${book.description || "No description available."}</p>
                    </div>

                    <div class="modal-book-details">
                        <div class="detail-item">
                            <div class="detail-label">Published Date</div>
                            <div class="detail-value">${formatDate(book.publishedDate)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Publisher</div>
                            <div class="detail-value">${book.publisher || "N/A"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Page Count</div>
                            <div class="detail-value">${book.pageCount || "N/A"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Language</div>
                            <div class="detail-value">${book.language ? book.language.toUpperCase() : "N/A"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">ISBN</div>
                            <div class="detail-value">${book.isbn || "N/A"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Categories</div>
                            <div class="detail-value">${book.categories ? book.categories.join(", ") : "N/A"}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Rating</div>
                            <div class="detail-value">
                                ${ratingStars}
                                <span>(${book.ratingsCount || 0} ratings)</span>
                            </div>
                        </div>
                    </div>

                    <div class="book-actions" style="margin-top: 20px;">
                        <a href="${book.previewLink}" target="_blank" class="btn btn-preview">
                            <i class="fas fa-external-link-alt"></i> Preview on Google Books
                        </a>
                        <a href="${book.infoLink}" target="_blank" class="btn btn-details">
                            <i class="fas fa-info-circle"></i> More Info
                        </a>
                    </div>
                </div>
            </div>
        `;

    bookModal.style.display = "flex";
  }

  function showPagination(startIndex) {
    pagination.innerHTML = "";

    const totalPages = Math.ceil(totalResults / booksPerPage);
    const currentPageNum = Math.floor(startIndex / booksPerPage);

    // Previous button
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.disabled = currentPageNum === 0;
    prevButton.addEventListener("click", function () {
      if (currentPageNum > 0) {
        navigateToPage(currentPageNum - 1);
      }
    });
    pagination.appendChild(prevButton);

    // Page buttons
    const maxPagesToShow = 5;
    let startPage = Math.max(
      0,
      currentPageNum - Math.floor(maxPagesToShow / 2),
    );
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i + 1;
      pageButton.className = i === currentPageNum ? "active" : "";
      pageButton.addEventListener("click", function () {
        navigateToPage(i);
      });
      pagination.appendChild(pageButton);
    }

    // Next button
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.disabled = currentPageNum >= totalPages - 1;
    nextButton.addEventListener("click", function () {
      if (currentPageNum < totalPages - 1) {
        navigateToPage(currentPageNum + 1);
      }
    });
    pagination.appendChild(nextButton);

    pagination.style.display = "flex";
  }

  async function navigateToPage(pageNum) {
    currentPage = pageNum;
    const startIndex = pageNum * booksPerPage;

    showLoading(true);
    clearBooksContainer();
    hidePagination();

    await fetchBooks(currentSearchQuery, startIndex);
  }

  // Helper functions
  function showLoading(show) {
    loadingIndicator.style.display = show ? "block" : "none";
  }

  function clearBooksContainer() {
    booksContainer.innerHTML = "";
    booksContainer.style.display = "none";
  }

  function showNoResults() {
    noResultsMessage.style.display = "block";
  }

  function hideNoResults() {
    noResultsMessage.style.display = "none";
  }

  function hidePagination() {
    pagination.style.display = "none";
  }

  function updateResultsCount(currentCount, startIndex) {
    const from = startIndex + 1;
    const to = startIndex + currentCount;
    resultsCount.textContent = `Showing ${from}-${to} of ${totalResults} results`;
  }

  function formatDate(dateString) {
    if (!dateString || dateString === "Unknown") return "Unknown";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  }

  function showError(message) {
    // Create error message element
    const errorEl = document.createElement("div");
    errorEl.className = "error-message";
    errorEl.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
                <strong>Error:</strong> ${message}
            </div>
        `;

    // Insert at the top of results section
    const resultsSection = document.querySelector(".results-section");
    resultsSection.insertBefore(errorEl, resultsSection.firstChild);

    // Remove after 5 seconds
    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }

  // Initialize with a default search
  searchInput.value = "JavaScript";
  performSearch();
});
