// Registry consumers never receive publisher or hosting credentials.
export function consumerEnvironment(source) {
  return Object.fromEntries(['PATH','SystemRoot','WINDIR','TEMP','TMP','HOME','USERPROFILE','ComSpec','PATHEXT','PLAYWRIGHT_BROWSERS_PATH']
    .filter(key=>source[key] !== undefined).map(key=>[key,source[key]]));
}
