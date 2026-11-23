#!/bin/bash
set -o pipefail
cd "$(dirname "$0")/../../mobile/ios" || exit 1
xcodebuild -workspace BloomFloral.xcworkspace -scheme BloomFloral -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build 2>&1 | tail -35
exit ${PIPESTATUS[0]}
