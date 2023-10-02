const axios = require("axios");
const lodash = require("lodash");
require("dotenv").config();

const cache = {
  blogs: null,
  output: null,
  query: null,
  searchedResult: null,
  timestamp: 0,
};

//function to fetch API
const fetchBlogs = async () => {
  try {
    const response = await axios.get(
      "https://intent-kit-16.hasura.app/api/rest/blogs",
      {
        headers: {
          "x-hasura-admin-secret": process.env.API_HEADER,
        },
      }
    );
    return response.data.blogs;
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    throw error;
  }
};

const memoizedGetBlogs = async () => {
  const currentTime = Date.now();

  if (
    !cache.output ||
    !cache.blogs ||
    currentTime - cache.timestamp > 1 * 60 * 1000
  ) {
    // console.log('data from API...');
    cache.blogs = await fetchBlogs();
    cache.timestamp = currentTime;

    const blogs = cache.blogs;

    let maxSize = 0;
    let longestTitle;
    let id;
    let privacy = 0;

    lodash.forEach(blogs, function (blog) {
      const title = blog.title;
      if (lodash.size(title) > maxSize) {
        maxSize = lodash.size(title);
        id = blog.id;
        longestTitle = blog.title;
      }

      if (
        lodash.includes(title, "privacy") ||
        lodash.includes(title, "Privacy")
      ) {
        privacy += 1;
      }
    });

    let uniqueBlogsArray = lodash.uniqBy(blogs, (item) =>
      lodash.lowerCase(item.title)
    );

    const output = {
      totalBlogs: blogs.length,
      longestBlogTitle: longestTitle,
      blogsTitleContainingPrivacy: privacy,
      uniqueBlogs: uniqueBlogsArray,
    };

    cache.output = output;

    return output;
  } else {
    // console.log('data from cache...');
    return cache.output;
  }
};

// get blogs and analysis
exports.getBlogs = async (req, res) => {
  try {
    const cachedResult = await memoizedGetBlogs();

    return res.status(200).json({
      output: cachedResult,
    });
  } catch (error) {
    console.error("Error in getBlogs");
    return res.status(500).json({
      error: error.message,
    });
  }
};

const memoizedSearchBlog = async (query) => {
  const currentTime = Date.now();
  if (
    (!cache.query && cache.query !== query) ||
    currentTime - cache.timestamp > 1 * 60 * 1000
  ) {
    // console.log("search result from API...");

    cache.blogs = await fetchBlogs();
    cache.timestamp = currentTime;
    cache.query = query;

    const blogs = cache.blogs;

    let searched = lodash.filter(blogs, (blog) =>
      lodash.includes(lodash.lowerCase(blog.title), lodash.lowerCase(query))
    );

    cache.searchedResult = searched;

    return searched;
  } else {
    // console.log("search result from Cache...");
    return cache.searchedResult;
  }
};

// search blogs based on query
exports.searchBlog = async (req, res) => {
  try {
    const query = req.query.query;
    const searchResult = await memoizedSearchBlog(query);
    return res.status(200).json({
      searchResult: searchResult,
    });
  } catch (error) {
    console.error("Error in searchBlog:");
    return res.status(500).json({
      error: error.message,
    });
  }
};
