# Variables
CLIENT_DIR   := frontend
BUILD_DIR    := $(CLIENT_DIR)/dist
TARGET_DIR   := /var/www/fingertips
SERVICE      := fingertips.service
BACKEND_DIR  := backend
VENV_DIR     := /home/ubuntu/global-env

.PHONY: deploy-frontend deploy-backend deploy

# Deploy only the React/Vite frontend
deploy-frontend:
	@echo "→ Building frontend…"
	cd $(CLIENT_DIR) && npm ci && npm run build
	@echo "→ Installing build to $(TARGET_DIR)…"
	sudo rm -rf $(TARGET_DIR)
	sudo mv $(BUILD_DIR) $(TARGET_DIR)
	sudo chown -R www-data:www-data $(TARGET_DIR)
	sudo chmod -R 755 $(TARGET_DIR)
	@echo "→ Reloading nginx"
	sudo nginx -t && sudo systemctl reload nginx

# Deploy only the FastAPI/Gunicorn backend
deploy-backend:
	@echo "→ Updating backend…"
	cd $(BACKEND_DIR) && $(VENV_DIR)/bin/python -m pip install --upgrade pip
	cd $(BACKEND_DIR) && $(VENV_DIR)/bin/python -m pip install -r requirements.txt
	@echo "→ Restarting service"
	sudo systemctl restart $(SERVICE)

# Deploy both frontend & backend
deploy: deploy-frontend deploy-backend
	@echo "✓ All done!"