#!/bin/bash
set -e
cd "$(dirname "$0")/../../mobile"
CI=1 npx expo prebuild --platform ios --clean
python3 - <<'PY'
p='ios/Podfile';s=open(p).read();needle="""    installer.target_installation_results.pod_target_installation_results
      .each do |pod_name, target_installation_result|
      target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
        resource_bundle_target.build_configurations.each do |config|
          config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        end
      end
    end""";patch=needle+"""

    # fmt from Expo SDK 52 / RN 0.76 needs C++17 under Xcode 26.
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end""";assert needle in s;open(p,'w').write(s.replace(needle,patch))
PY
cd ios
pod install --silent
xcodebuild -workspace BloomFloral.xcworkspace -scheme BloomFloral -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro' CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -45
