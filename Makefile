include .env

DEPLOY_DIR = $(OBSIDIAN_PLUGINS_DIR)/$(PLUGIN_NAME)

.PHONY: build dev test install clean deploy

install:
	npm install

build:
	npx rollup --config rollup.config.js --environment BUILD:production

dev:
	npx rollup --config rollup.config.js -w

test:
	node test-urls.mjs

clean:
	rm -f main.js

deploy: build
	mkdir -p "$(DEPLOY_DIR)"
	cp main.js "$(DEPLOY_DIR)/"
	cp styles.css "$(DEPLOY_DIR)/" 2>/dev/null || true
	jq '.id = "$(PLUGIN_NAME)" | .name = "Auto Link Title (Fixed)"' manifest.json > "$(DEPLOY_DIR)/manifest.json"
	@echo "Deployed to $(DEPLOY_DIR)"
	@echo "Restart Obsidian and enable '$(PLUGIN_NAME)' in Community Plugins."
