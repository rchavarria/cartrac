import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PROJECT_ROOT, resolveDatabasePath } from '../src/bootstrap.ts';

describe('resolveDatabasePath', () => {
  it('resolves relative paths against the project root', () => {
    assert.equal(resolveDatabasePath('data/cartrac.db'), join(PROJECT_ROOT, 'data', 'cartrac.db'));
    assert.equal(resolveDatabasePath('./data/../data/x.db'), join(PROJECT_ROOT, 'data', 'x.db'));
  });

  it('rejects absolute paths', () => {
    assert.throws(() => resolveDatabasePath('/tmp/cartrac.db'), /relative to the project root/);
  });

  it('rejects paths outside the project or pointing to the root itself', () => {
    assert.throws(() => resolveDatabasePath('../cartrac.db'), /inside the project root/);
    assert.throws(() => resolveDatabasePath('data/../../x.db'), /inside the project root/);
    assert.throws(() => resolveDatabasePath('.'), /inside the project root/);
    assert.throws(() => resolveDatabasePath(''), /relative to the project root/);
  });
});
