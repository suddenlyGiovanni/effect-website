export type PackageManager = "bun" | "npm" | "pnpm" | "yarn" | "deno"

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "bun"

export const PACKAGE_MANAGERS: ReadonlyArray<PackageManager> = [
  DEFAULT_PACKAGE_MANAGER,
  "npm",
  "pnpm",
  "yarn",
  "deno",
]

const INSTALL_COMMAND_BY_PACKAGE_MANAGER: Readonly<Record<PackageManager, string>> = {
  bun: "bun add effect",
  npm: "npm install effect",
  pnpm: "pnpm add effect",
  yarn: "yarn add effect",
  deno: "deno add npm:effect",
}

export const getInstallCommand = (packageManager: PackageManager): string => {
  return INSTALL_COMMAND_BY_PACKAGE_MANAGER[packageManager]
}
