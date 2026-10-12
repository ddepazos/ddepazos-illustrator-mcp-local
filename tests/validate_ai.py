"""Validate notebook code as real Python, plus CEP resources and suite consistency."""
import ast
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import nbformat

root = Path(__file__).resolve().parents[1]
notebook = nbformat.read(root / 'colab/Pazos_AI_Turntable.ipynb', as_version=4)
nbformat.validate(notebook)
for cell in notebook.cells:
    if cell.cell_type == 'code':
        ast.parse(cell.source)
        assert cell.outputs == [] and cell.execution_count is None
for folder in ['ai-turntable-bridge', 'tools-manager']:
    manifest = ET.parse(root / folder / 'CSXS/manifest.xml')
    for tag in ['MainPath', 'ScriptPath']:
        assert (root / folder / manifest.find('.//' + tag).text).is_file()
    assert manifest.find('.//Host').attrib['Name'] == 'ILST'
assert json.loads((root/'suite-version.json').read_text()) == json.loads((root/'tools-manager/version.json').read_text())
print('Notebook Python, schema, CEP resources and versions: OK')
