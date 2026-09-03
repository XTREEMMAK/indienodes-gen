// A minimal, dependency-free ZIP writer: local file headers + a central
// directory + the end-of-central-directory record, per the PKZIP APPNOTE
// layout, using Node's built-in zlib for compression. No archiver package,
// and no shelling out to a system `zip` binary that a given machine or CI
// image might not have — this keeps the build's only real dependencies
// Node itself, matching the rest of the toolchain's "boring on purpose"
// approach (see README, "Run it locally").
import { deflateRawSync } from "node:zlib";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const CRC_TABLE = buildCrcTable();

function buildCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ZIP stores timestamps in DOS date/time format (1980 epoch, 2-second
// resolution) regardless of platform.
function toDosDateTime(date) {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day =
    ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function listFiles(rootDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  };
  walk(rootDir);
  return files.sort();
}

/**
 * Writes every file under `sourceDir` into a single ZIP archive at
 * `outputPath`. Entry names are paths relative to `sourceDir`, always with
 * forward slashes (the ZIP spec requires this regardless of platform), so
 * extracting the archive reproduces `sourceDir`'s own directory structure
 * with `sourceDir` itself as the root.
 * @param {string} sourceDir
 * @param {string} outputPath
 */
export function zipDirectory(sourceDir, outputPath) {
  const files = listFiles(sourceDir);
  const { time, day } = toDosDateTime(new Date());

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const filePath of files) {
    const relPath = path.relative(sourceDir, filePath).split(path.sep).join("/");
    const nameBuf = Buffer.from(relPath, "utf8");
    const content = readFileSync(filePath);
    const crc = crc32(content);
    const compressed = deflateRawSync(content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed to extract
    localHeader.writeUInt16LE(0, 6); // general purpose bit flag
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(day, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed to extract
    centralHeader.writeUInt16LE(0, 8); // general purpose bit flag
    centralHeader.writeUInt16LE(8, 10); // compression method
    centralHeader.writeUInt16LE(time, 12);
    centralHeader.writeUInt16LE(day, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // file comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal file attributes
    centralHeader.writeUInt32LE((0o100644 << 16) >>> 0, 38); // external attributes: regular file
    centralHeader.writeUInt32LE(offset, 42); // offset of local header
    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const localSection = Buffer.concat(localParts);
  const centralSection = Buffer.concat(centralParts);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // number of this disk
  end.writeUInt16LE(0, 6); // disk where central directory starts
  end.writeUInt16LE(files.length, 8); // records on this disk
  end.writeUInt16LE(files.length, 10); // total records
  end.writeUInt32LE(centralSection.length, 12);
  end.writeUInt32LE(localSection.length, 16); // offset of central directory
  end.writeUInt16LE(0, 20); // comment length

  writeFileSync(outputPath, Buffer.concat([localSection, centralSection, end]));
}
