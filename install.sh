#!/bin/sh

poetry install
cd submodules/apex
npm install
cd -
cd apex_aptesting/app
npm install
cd -

