// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CaseStudyEditorProvider, CaseStudy } from './caseStudyExplorer';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// register provider and 
	console.log("activating Case Study Editor...");
	var caseStudyEditorView : vscode.TreeView<CaseStudy> ;
	const caseStudyEditorProvider = new CaseStudyEditorProvider(context);
	//const caseStudyEditorView = vscode.window.registerTreeDataProvider('nodeDependencies', caseStudyEditorProvider);

	caseStudyEditorView = vscode.window.createTreeView<CaseStudy>('caseStudyExplorer', {treeDataProvider: caseStudyEditorProvider});
	caseStudyEditorProvider.registerTreeView(caseStudyEditorView);
	vscode.commands.registerCommand('caseStudyExplorer.refreshEntry', () => caseStudyEditorProvider.refresh());
	vscode.commands.registerCommand('caseStudyExplorer.loadCaseStudies', () => caseStudyEditorProvider.loadCaseStudiesFromDisk());
	//vscode.commands.registerCommand('extension.openPackageOnNpm', moduleName => vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${moduleName}`)));
	vscode.commands.registerCommand('caseStudyExplorer.addEntry', () => caseStudyEditorProvider.addEntry());
	vscode.commands.registerCommand('caseStudyExplorer.editEntry', (node: CaseStudy) => caseStudyEditorProvider.editEntry(node));
	vscode.commands.registerCommand('caseStudyExplorer.deleteEntry', (node: CaseStudy) => caseStudyEditorProvider.deleteEntry(node));

}

// this method is called when your extension is deactivated
export function deactivate() {}
