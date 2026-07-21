#! /usr/bin/env bash

set -e
set -x

# Run migrations
alembic upgrade head

# Create initial data
python app/initial_data.py