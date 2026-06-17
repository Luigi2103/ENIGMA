@echo off

docker run --rm ^
-v "%cd%:/zap/wrk" ^
ghcr.io/zaproxy/zaproxy:stable ^
zap.sh -cmd -autorun /zap/wrk/zap.yaml

pause