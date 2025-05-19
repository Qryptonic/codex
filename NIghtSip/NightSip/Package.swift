// swift-tools-version:5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "NightSip",
    platforms: [
        .iOS(.v14)
    ],
    products: [
        .executable(name: "NightSip", targets: ["NightSip"]),
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "NightSip",
            dependencies: [],
            path: ".",
            resources: [.process("Assets")],
            swiftSettings: [],
            linkerSettings: [
                .linkedFramework("HealthKit")
            ]
        )
    ]
)
