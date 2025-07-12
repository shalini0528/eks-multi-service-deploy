# Use lightweight Nginx image
FROM nginx:alpine

# Remove default Nginx web content
RUN rm -rf /usr/share/nginx/html/*

# Copy static site content into nginx web root
COPY . /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
