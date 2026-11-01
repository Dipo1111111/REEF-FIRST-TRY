@echo off
rem Publishes Reef to npm in dependency order: platform binaries first, launcher last.
rem
rem npm refuses to publish without a 2FA proof. Either:
rem   - create a Granular Access Token with "Bypass 2FA" and put it in %USERPROFILE%\.npmrc as
rem     //registry.npmjs.org/:_authToken=..., or
rem   - run this with the current OTP from an authenticator.
rem
rem   publish.cmd            publish every tarball in code\dist\npm
rem   publish.cmd 123456     same, passing an OTP
setlocal
set "DIST=%~dp0..\code\dist\npm"
if not exist "%DIST%" (
  echo No tarballs at %DIST%. Build and pack first.
  exit /b 1
)
set "OTP="
if not "%~1"=="" set "OTP=--otp=%~1"

call :publish "%DIST%\reefcode-windows-x64-*.tgz"
call :publish "%DIST%\reefcode-darwin-arm64-*.tgz"
call :publish "%DIST%\reefcode-darwin-x64-*.tgz"
call :publish "%DIST%\reefcode-0.1.0.tgz"
echo Done.
exit /b 0

:publish
for %%F in (%~1) do (
  echo Publishing %%~nxF
  call npm publish "%%F" --access public %OTP%
  if errorlevel 1 exit /b 1
)
exit /b 0
