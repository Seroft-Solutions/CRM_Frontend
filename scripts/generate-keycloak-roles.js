#!/usr/bin/env node
/**
 * scripts/generate-keycloak-roles.js
 *
 * Automatically:
 *  - Finds the project root (one level up from scripts/)
 *  - Uses .jhipster/ in the project root
 *  - Writes keycloak-roles.json into scripts/
 *
 * Optionally set KEYCLOAK_REALM (env var) or defaults to "crm"
 */

const fs   = require('fs');
const path = require('path');

// ── Compute paths ───────────────────────────────────────────────────────────────
// __dirname === .../CRM_Frontend/scripts
const scriptsDir  = __dirname;
const projectRoot = path.resolve(scriptsDir, '..');
const jhipsterDir = path.join(projectRoot, '.jhipster');
const outputFile  = path.join(scriptsDir, 'keycloak-roles.json');

const realm = process.env.KEYCLOAK_REALM || 'crm';
console.log(`\n▶️  Generating Keycloak roles for realm="${realm}"`);
console.log(`   • Reading entities from: ${jhipsterDir}`);
console.log(`   • Writing roles to:     ${outputFile}\n`);

// ── Helpers ────────────────────────────────────────────────────────────────────
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0, v = c=='x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

// ── Read entity files ───────────────────────────────────────────────────────────
let files;
try {
    files = fs.readdirSync(jhipsterDir).filter(f => f.endsWith('.json')).sort();
} catch (err) {
    console.error(`✖ Unable to read .jhipster directory:`, err.message);
    process.exit(1);
}

if (files.length === 0) {
    console.error(`✖ No .json entity files found under ${jhipsterDir}`);
    process.exit(1);
}

console.log(`✔ Found ${files.length} entities:`, files.map(f => f.replace('.json','')).join(', '));

// ── Build roles ────────────────────────────────────────────────────────────────
const actions    = ['create','read','update','delete'];
const timestamp  = new Date().toISOString();
const realmRoles = [];

// CRUD + admin per entity
files.forEach(file => {
    const entityName = path.basename(file, '.json');
    const key        = entityName.charAt(0).toLowerCase() + entityName.slice(1);

    // CRUD
    actions.forEach(act => {
        realmRoles.push({
            id:          uuid(),
            name:        `${key}:${act}`,
            description: `Permission to ${act} ${entityName} records`,
            composite:   false,
            clientRole:  false,
            containerId: realm,
            attributes: {
                entity:      [ entityName ],
                action:      [ act ],
                generated:   [ 'true' ],
                generatedAt: [ timestamp ]
            }
        });
    });

    // Admin composite
    realmRoles.push({
        id:          uuid(),
        name:        `${key}:admin`,
        description: `Full administrative access to ${entityName} records`,
        composite:   true,
        clientRole:  false,
        containerId: realm,
        composites: {
            realm: actions.map(a => `${key}:${a}`)
        },
        attributes: {
            entity:      [ entityName ],
            action:      [ 'admin' ],
            generated:   [ 'true' ],
            generatedAt: [ timestamp ]
        }
    });
});

// Superadmin across all admin roles
realmRoles.push({
    id:          uuid(),
    name:        'system:superadmin',
    description: 'Full administrative access to all system entities',
    composite:   true,
    clientRole:  false,
    containerId: realm,
    composites: {
        realm: files.map(f => {
            const entKey = f.replace('.json','');
            return entKey.charAt(0).toLowerCase() + entKey.slice(1) + ':admin';
        })
    },
    attributes: {
        systemRole:  [ 'true' ],
        generated:   [ 'true' ],
        generatedAt: [ timestamp ]
    }
});

// ── Output JSON ────────────────────────────────────────────────────────────────
const out = {
    roles: {
        realm: realmRoles
    }
};

try {
    fs.writeFileSync(outputFile, JSON.stringify(out, null, 2), 'utf8');
    console.log(`\n✅  Successfully wrote ${realmRoles.length} roles to ${outputFile}\n`);
} catch (err) {
    console.error(`✖ Error writing roles file:`, err.message);
    process.exit(1);
}
