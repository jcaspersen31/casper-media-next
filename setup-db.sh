#!/bin/bash
# Run this once to set up the Gristmill database
# Usage: ./setup-db.sh

DATABASE_URL="postgresql://postgres:wPbdBvhYIqfNrlQYwuLphhipXsZGSTvP@acela.proxy.rlwy.net:54419/railway"

echo "Setting up Gristmill database..."
psql $DATABASE_URL -f schema.sql
echo "Done! All tables created."
