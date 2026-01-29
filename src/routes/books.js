const express = require("express");
const axios = require("axios");
const router = express.Router();

// Google Books API base URL
const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

// Search books endpoint
router.get("/books/search", async (req, res) => {
  try {
    const { q, maxResults = 20, startIndex = 0 } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    // Construct Google Books API URL
    const apiUrl = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(q)}&maxResults=${maxResults}&startIndex=${startIndex}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;

    console.log(`Searching for: ${q}`);

    // Make request to Google Books API
    const response = await axios.get(apiUrl);

    // Transform the response to a cleaner format
    const books = response.data.items
      ? response.data.items.map((item) => ({
          id: item.id,
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors || ["Unknown Author"],
          publishedDate: item.volumeInfo.publishedDate || "Unknown",
          description:
            item.volumeInfo.description || "No description available.",
          thumbnail: item.volumeInfo.imageLinks
            ? item.volumeInfo.imageLinks.thumbnail
            : "https://via.placeholder.com/128x192?text=No+Image",
          previewLink:
            item.volumeInfo.previewLink ||
            `https://books.google.com/books?id=${item.id}`,
          infoLink:
            item.volumeInfo.infoLink ||
            `https://books.google.com/books?id=${item.id}`,
          pageCount: item.volumeInfo.pageCount,
          categories: item.volumeInfo.categories || ["Uncategorized"],
          averageRating: item.volumeInfo.averageRating || 0,
          ratingsCount: item.volumeInfo.ratingsCount || 0,
        }))
      : [];

    res.json({
      totalItems: response.data.totalItems || 0,
      books: books,
    });
  } catch (error) {
    console.error("Error searching books:", error.message);

    // Handle specific error cases
    if (error.response) {
      // Google Books API returned an error
      res.status(error.response.status).json({
        error: "Failed to fetch books from Google Books API",
        details: error.response.data.error?.message || "Unknown error",
      });
    } else if (error.request) {
      // No response received
      res.status(503).json({
        error: "No response from Google Books API. Please try again later.",
      });
    } else {
      // Something else went wrong
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});

// Get book by ID endpoint
router.get("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const apiUrl = `${GOOGLE_BOOKS_API}/${id}?key=${process.env.GOOGLE_BOOKS_API_KEY}`;

    const response = await axios.get(apiUrl);

    const book = {
      id: response.data.id,
      title: response.data.volumeInfo.title,
      authors: response.data.volumeInfo.authors || ["Unknown Author"],
      publishedDate: response.data.volumeInfo.publishedDate || "Unknown",
      description:
        response.data.volumeInfo.description || "No description available.",
      thumbnail: response.data.volumeInfo.imageLinks
        ? response.data.volumeInfo.imageLinks.thumbnail
        : "https://via.placeholder.com/128x192?text=No+Image",
      previewLink:
        response.data.volumeInfo.previewLink ||
        `https://books.google.com/books?id=${response.data.id}`,
      infoLink:
        response.data.volumeInfo.infoLink ||
        `https://books.google.com/books?id=${response.data.id}`,
      pageCount: response.data.volumeInfo.pageCount,
      categories: response.data.volumeInfo.categories || ["Uncategorized"],
      averageRating: response.data.volumeInfo.averageRating || 0,
      ratingsCount: response.data.volumeInfo.ratingsCount || 0,
      publisher: response.data.volumeInfo.publisher,
      language: response.data.volumeInfo.language,
      isbn: response.data.volumeInfo.industryIdentifiers
        ? response.data.volumeInfo.industryIdentifiers.find(
            (id) => id.type === "ISBN_13",
          )?.identifier ||
          response.data.volumeInfo.industryIdentifiers.find(
            (id) => id.type === "ISBN_10",
          )?.identifier
        : null,
    };

    res.json(book);
  } catch (error) {
    console.error("Error fetching book details:", error.message);

    if (error.response && error.response.status === 404) {
      res.status(404).json({
        error: "Book not found",
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch book details",
      });
    }
  }
});

module.exports = router;
