const fs = require('fs');
const path = require('path');

/**
 * Simple generator function to test the concept
 */
async function generateForEntity(entityName) {
  console.log(`Generating components for entity: ${entityName}`);
  
  // Define paths with ABSOLUTE PATHS
  const projectRoot = 'D:\\code\\CRMCup\\CRM_Frontend';
  const jhipsterDir = path.join(projectRoot, '.jhipster');
  const templateDir = path.join(projectRoot, 'codgen', 'nextjs', 'templates');
  const outputDir = path.join(projectRoot, 'src');
  
  try {
    // Read entity definition
    const entityDefinitionPath = path.join(jhipsterDir, `${entityName}.json`);
    console.log(`Reading entity definition from: ${entityDefinitionPath}`);
    
    const entityDefinition = JSON.parse(fs.readFileSync(entityDefinitionPath, 'utf8'));
    
    // Just print out entity information for testing
    console.log(`Entity ${entityName} has ${entityDefinition.fields.length} fields and ${(entityDefinition.relationships || []).length} relationships`);
    console.log('Generation would output to:', path.join(outputDir, 'app', '(protected)', entityName.toLowerCase() + 's'));
    
    // Success message
    console.log(`Test generation for ${entityName} complete`);
  } catch (error) {
    console.error(`Error generating for ${entityName}:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Define paths with ABSOLUTE PATHS
    const projectRoot = 'D:\\code\\CRMCup\\CRM_Frontend';
    const jhipsterDir = path.join(projectRoot, '.jhipster');
    
    // Get entity name from command line or generate for all
    const entityName = process.argv[2];
    if (entityName) {
      await generateForEntity(entityName);
    } else {
      console.log(`Reading entities from: ${jhipsterDir}`);
      try {
        const entityFiles = fs.readdirSync(jhipsterDir).filter(file => file.endsWith('.json'));
        
        console.log(`Found ${entityFiles.length} entity definitions`);
        
        // Generate for each entity
        for (const entityFile of entityFiles) {
          const name = entityFile.replace('.json', '');
          await generateForEntity(name);
        }
      } catch (error) {
        console.error(`Error reading directory ${jhipsterDir}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in generation process:', error);
  }
}

// Run the main function
main();
