# ============================================================================
# FILE:
# /terraform/main.tf
# ============================================================================

module "network" {}

module "kubernetes" {}

module "database" {}

module "object_storage" {}

module "monitoring" {}

module "security" {}

module "identity" {}

module "event_bus" {}
