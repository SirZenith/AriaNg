#!/bin/bash
set -e

# Publishes the built web frontend (dist/) to the AriaNg-DailyBuild repository.
# Requires a deploy key with write access and the following environment variables
# provided by CircleCI: CI, CIRCLE_BRANCH, CIRCLE_SHA1.

if [ "$CI" == "true" ] && [ "$CIRCLE_BRANCH" == "master" ]; then
  git config --global user.name "CircleCI"
  git config --global user.email "CircleCI"

  echo "Publishing daily build..."
  git clone git@github.com:mayswind/AriaNg-DailyBuild.git "$HOME/AriaNg-DailyBuild/"

  rm -rf "${HOME:?}/AriaNg-DailyBuild/"*
  cp -r dist/* "$HOME/AriaNg-DailyBuild/"

  cd "$HOME/AriaNg-DailyBuild/"
  git add -A
  git commit -a -m "daily build #$CIRCLE_SHA1"
  git push origin master

  echo "Done."
fi
