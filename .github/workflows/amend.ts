import * as fs from 'node:fs';
import { clean, valid } from 'semver';

console.log('starting amend package version...');

console.log(valid('release(v1.2.3): asdfsdf'));

let packageObj: { version: string, publishConfig: { tag: string } } | undefined;

try {
    const packageContent: string = fs.readFileSync('./package.json', { encoding: 'utf8' });
    packageObj = JSON.parse(packageContent);
} catch (error) {
    console.error('error occured when reading and parsing "package.json"', error);
    process.exit(1);
}

if (typeof packageObj == 'undefined') {
    console.error('no "package.json" object parsed');
    process.exit(1);
}

if (packageObj.version != '0.0.0') {
    console.log(`exiting since package version is "${packageObj.version}" instead of "0.0.0"`);
    console.log('nothing touched');
    process.exit();
}

const refType: string | undefined = process.env['GITHUB_REF_TYPE'];
console.log('reading env variable "GITHUB_REF_TYPE":', refType);

if (typeof refType != 'string') {
    console.error('env variable "GITHUB_REF_TYPE" not found');
    process.exit(1);
}

if (refType != 'tag') {
    console.error('exiting since "GITHUB_REF_TYPE" is not "tag"');
    process.exit();
}

const refName: string | undefined = process.env['GITHUB_REF_NAME'];
console.log('reading env variable "GITHUB_REF_NAME":', refName);

if (typeof refName != 'string') {
    console.error('env variable "GITHUB_REF_NAME" not found');
    process.exit(1);
}

const version: string | null = clean(refName);
if (typeof version != 'string') {
    console.error(`parse ${refName} to semver failed`);
    process.exit(1);
}

const isRelease: string | undefined = process.env['GITHUB_IS_PRERELEASE'];
console.log('reading env variable "GITHUB_IS_PRERELEASE":', isRelease);

if (typeof isRelease != 'string' || !isRelease) {
    console.error('env variable "GITHUB_IS_PRERELEASE" not found or is empty');
    process.exit(0);
}

console.log(`setting package version to "${version}"`);
packageObj.version = version;
if (isRelease == 'true') {
    console.log(`setting package publish tag to "next" since GITHUB_IS_PRERELEASE=${isRelease}`);
    packageObj.publishConfig.tag = 'next';
}

try {
    fs.writeFileSync('./package.json', JSON.stringify(packageObj, null, 4), { encoding: 'utf8' });
} catch (error) {
    console.error('error occured when writing amended "package.json"', error);
    process.exit(1);
}

console.log('done amending');
