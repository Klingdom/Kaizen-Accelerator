#!/bin/bash

# Verify all services are running and healthy

# Check if Service A is running
if curl -s http://service-a/health | grep -q 'healthy'; then
  echo "Service A is running and healthy"
else
  echo "Service A is NOT healthy"
fi

# Check if Service B is running
if curl -s http://service-b/health | grep -q 'healthy'; then
  echo "Service B is running and healthy"
else
  echo "Service B is NOT healthy"
fi

# Add checks for other services as needed
