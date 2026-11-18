import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const contextPath = path.resolve(
  process.cwd(),
  'src/context/AppContext.tsx'
);

const contextSource = fs.readFileSync(contextPath, 'utf8');

const functionStart = contextSource.indexOf(
  'const deleteGalleryItem = async (id: string) => {'
);

const functionEnd = contextSource.indexOf(
  '\n  /**',
  functionStart
);

assert.notEqual(functionStart, -1, 'Gallery deletion function must exist');
assert.notEqual(functionEnd, -1, 'Gallery deletion function must have an end');

const deleteFunction = contextSource.slice(functionStart, functionEnd);

test('gallery deletion retrieves Storage paths before deleting the row', () => {
  const fetchPosition = deleteFunction.indexOf(
    ".select('image_path, thumbnail_path')"
  );

  const deletePosition = deleteFunction.indexOf(
    ".delete()"
  );

  assert.notEqual(fetchPosition, -1);
  assert.notEqual(deletePosition, -1);
  assert.ok(fetchPosition < deletePosition);
});

test('gallery deletion validates paths before Storage cleanup', () => {
  assert.match(deleteFunction, /isStoragePath\(galleryItem\.image_path\)/);
  assert.match(deleteFunction, /isStoragePath\(galleryItem\.thumbnail_path\)/);
  assert.match(deleteFunction, /deleteUploadedGalleryStorageObjects/);
});

test('gallery deletion checks remaining image and thumbnail references', () => {
  assert.match(
    deleteFunction,
    /\.eq\('image_path', imagePath\)/
  );

  assert.match(
    deleteFunction,
    /\.eq\('thumbnail_path', thumbnailPath\)/
  );

  assert.match(deleteFunction, /data\.length === 0/);
});

test('gallery deletion preserves Storage objects when reference checks fail', () => {
  assert.match(
    deleteFunction,
    /Could not verify remaining image references\. Preserving Storage object/
  );

  assert.match(
    deleteFunction,
    /Could not verify remaining thumbnail references\. Preserving Storage object/
  );
});

test('gallery deletion updates UI only after database deletion succeeds', () => {
  const databaseDeletePosition = deleteFunction.indexOf('.delete()');
  const databaseErrorCheckPosition = deleteFunction.indexOf(
    'if (deleteError) throw deleteError;'
  );
  const deletionSuccessCheckPosition = deleteFunction.indexOf(
    'if (!deletedItem)'
  );
  const uiUpdatePosition = deleteFunction.indexOf(
    'setGallery(',
    databaseDeletePosition
  );

  assert.notEqual(databaseDeletePosition, -1);
  assert.notEqual(databaseErrorCheckPosition, -1);
  assert.notEqual(deletionSuccessCheckPosition, -1);
  assert.notEqual(uiUpdatePosition, -1);

  assert.ok(databaseDeletePosition < databaseErrorCheckPosition);
  assert.ok(databaseErrorCheckPosition < deletionSuccessCheckPosition);
  assert.ok(deletionSuccessCheckPosition < uiUpdatePosition);
});