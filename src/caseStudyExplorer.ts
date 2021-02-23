import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
export enum GlyphChars {
	Asterisk = '\u2217'
}

// Tree Item is CaseStudy object
export class CaseStudy extends vscode.TreeItem {

	public readonly customer : string;

	constructor(
		public readonly label : string,
		public readonly country : string,
		public readonly sector : string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.customer = label;
		this.country = country;
		this.sector = sector;
		this.tooltip = `${this.country} : ${this.sector}`;
		//this.description = `${GlyphChars.Asterisk}`
		this.label = this.customer;
		this.command = { 
			command: 'caseStudyExplorer.editEntry',
			title: this.customer,
			arguments: [{label:this.customer}]
		};
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
	};

	contextValue = 'casestudy';
}

import { resolveCliPathFromVSCodeExecutablePath } from 'vscode-test';

var tree = {
	"caseStudies": [
       {"customer": "",
	   "country" : "",
	   "url": "",
	   "sector": "",
	   "challenge": "",
	   "solution": "",
	   "byline": "",
	   "technologies": [],
	   "newCustomer" : ""}
	],
	"sectors" : [],
	"technologies": []	
};

var Customer = {
	"customer": "",
	"country" : "",
	"url": "",
	"sector": "",
	"challenge": "",
	"solution": "",
	"byline": "",
	"technologies": [],
	"newCustomer" : ""
};




// define dialogue box
const options: vscode.OpenDialogOptions = {
	canSelectMany: false,
	openLabel: 'Open',
	filters: {
	   'Text files': ['json'],
	   'All files': ['*']
   }
};

// define the editor tree
export class CaseStudyEditorProvider implements vscode.TreeDataProvider<CaseStudy> {

	private _onDidChangeTreeData: vscode.EventEmitter<CaseStudy | undefined | void> = new vscode.EventEmitter<CaseStudy | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CaseStudy | undefined | void> = this._onDidChangeTreeData.event;
	private panel : vscode.WebviewPanel | undefined = undefined;

	private bEdited : boolean = false;
	private bFirstTime: boolean = true;
	private customer :string = '';
	private context : vscode.ExtensionContext;
	private bWebViewExists : boolean = false;
	private caseStudyEditorView : vscode.TreeView<CaseStudy> | undefined;
	private caseStudies : Array<CaseStudy> | undefined;
	private filePath : string = '';
	private stashCustomerVals = Customer;


	constructor(context: vscode.ExtensionContext) {
		// create Web Panel
		this.context = context;
		this.bEdited = false;
		this.customer = '';

	}

	registerTreeView(caseStudyEditorView: vscode.TreeView<CaseStudy> ){
		this.caseStudyEditorView = caseStudyEditorView;
	}

	// -------------------------------------------------------------------------------------------
	// UI

	confirmDiscardDialogue(customer: string) : Promise<boolean| string>{
		return new Promise((resolve, reject) => {		
			vscode.window.showWarningMessage("Discard Changes to '"+customer+"'?", { modal: true }, ...[ "Discard" ]).then((action:string | undefined) => {
				if ( action === "Discard") {
					resolve(action);
				} else {
					resolve("Cancel");
				}
			});
		});
	}

	confirmDeleteDialogue(customer: string) : Promise<boolean| string>{
		return new Promise((resolve, reject) => {		
			vscode.window.showWarningMessage("Delete '"+customer+"' case study?", { modal: true }, ...[ "OK" ]).then((action:string | undefined) => {
				if ( action === "OK") {
					resolve(action);
				} else {
					resolve("Cancel");
				}
			});
		});
	}
	
	// show selected <CaseStudy> object that meets customer name
	selectCaseStudy(customer: string){
		if (this.caseStudyEditorView !== undefined){
			this.caseStudies?.forEach( element => {
				if (element.customer === customer){
					this.caseStudyEditorView?.reveal(element, {focus: true});
				}
			});
		}
	}

	// reload case study view with stashed values
	reloadCaseStudy(): void {
	
		if (!this.bWebViewExists){
			this.createWebView(this.context);
		}
		if (this.panel?.webview !== null){
			// send load message to webview
			this.panel?.webview.postMessage({ command: 'reload', customer: this.stashCustomerVals, technologies: tree.technologies, sectors: tree.sectors });
			
			// set variables and view title
			this.customer = this.stashCustomerVals.customer;
			if ( this.stashCustomerVals.customer !== this.stashCustomerVals.newCustomer ){
				this.bEdited = true;
				this.updateEditStatus(true);

			} else {
				this.bEdited = false;
				this.updateEditStatus(false);
			}
			
			if (this.panel){
				this.updateEditStatus(this.bEdited);
			}
		}
		else {
			console.log('webview null');
		}
	}

	updateEditStatus(edited :boolean) : void {
		if (edited){
			// add * to title
			if (this.panel){
				this.panel.title = this.stashCustomerVals.newCustomer+`${GlyphChars.Asterisk}`;
			}
		}
		else {
			// remove star
			if (this.panel){
				this.panel.title = this.stashCustomerVals.newCustomer;
			}
		}
	}

	// -------------------------------------------------------------------------------------------
	// Menu Command

	loadCaseStudy(customerName: String): void {
		tree.caseStudies.forEach(element => {
			if (element.customer === customerName){
				if (!this.bWebViewExists){
					this.createWebView(this.context);
				}
				if (this.panel?.webview !== null){
					// send load message to webview
					this.panel?.webview.postMessage({ command: 'load', customer: element, technologies: tree.technologies, sectors: tree.sectors });
					element.newCustomer = element.customer;
					this.stashCustomerVals = element;
					
					// set variables and view title
					this.customer = element.customer;
					this.bEdited = false;
					if (this.panel){
						this.panel.title = element.customer;
					}
				}
				else {
					console.log('webview null');
				}
			}
		});
	}

	// update customer record from webview and save to file
	saveCaseStudy(customerRecord: any){
		tree.caseStudies.forEach((element,index,arr) => {
			// find customer in list and update
			if (element.customer === customerRecord.customer){
				customerRecord.customer = customerRecord.newCustomer;
				tree.caseStudies[index] = customerRecord;
				this.saveCaseStudiesToDisk();
				this.refresh();
				this.selectCaseStudy(customerRecord.newCustomer);
				this.bEdited = false;
			}
		});
	} 

	// ui command edit
	editEntry(caseStudy: CaseStudy): void {

		if (this.customer === caseStudy.label){
			// already on it return
			return;
		}
	
		if (this.bEdited && caseStudy.label !== this.customer){
			// confirm save before moving on
			this.confirmDiscardDialogue(this.customer).then((result)=>{
				switch (result) {
					case 'Discard':
						this.loadCaseStudy(caseStudy.label);
						break;
					case 'Cancel':
						this.selectCaseStudy(this.customer);
				}
			});
		}
		else 
		{
			// just load, not edited 
			this.loadCaseStudy(caseStudy.label);
			this.selectCaseStudy(caseStudy.label);
		}

		// reveal
		this.panel?.reveal();
	}

	deleteEntry(caseStudy: CaseStudy): void {
		console.log('delete: '+caseStudy.customer);
		if (this.customer !== caseStudy.label){
			// not selected
			vscode.window.showErrorMessage('Please select a customer first and then delete');
			return;
		}

		this.confirmDeleteDialogue(caseStudy.customer).then((result)=>{
			switch (result) {
				case 'OK':
					// delete selected case study
					tree.caseStudies.forEach( (element, index) => {
						if (element.customer === caseStudy.customer){
							// delete at index
							tree.caseStudies.splice(index,1);
							this.refresh();
							this.bEdited = true;
							this.saveCaseStudiesToDisk();
							this.bEdited = false;
							vscode.window.showInformationMessage('Deleted:'+caseStudy.customer);
							
							// make selection -1 
							if (index-1 < 0)
								index = 1;
		
							this.loadCaseStudy(tree.caseStudies[index-1].customer);
							this.selectCaseStudy(tree.caseStudies[index-1].customer);
							this.panel?.reveal();
							
						}							
					});

					
					break;
				case 'Cancel':
					break;
			}
		});
	}

	addEntry()  // UI command
	{
		console.log('add entry');
		if (this.bEdited){
			// edited
			// confirm discard before moving on
			this.confirmDiscardDialogue(this.customer).then((result)=>{
				switch (result) {
					case 'Discard':
						this.addNewEntry();
						this.loadCaseStudy(this.customer);
						this.panel?.reveal()	
						this.selectCaseStudy(this.customer);
						break;
					case 'Cancel':
						return;
				}
			});
		}
		else
			this.addNewEntry();
	}

	addNewEntry(): void {

		var index = tree.caseStudies.length;
		// add new case study
		tree.caseStudies.push(
			{
				"customer": "customer"+index,
				"country" : "",
				"url": "",
				"sector": "",
				"challenge": "",
				"solution": "",
				"byline": "",
				"technologies": [],
				"newCustomer" : ""
			}
		);
		this.refresh();
		this.bEdited = true;
		this.saveCaseStudiesToDisk();
		vscode.window.showInformationMessage('Added new customer: customer'+index);
	}

	

	// menu command
	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	// load CaseStudyFiles called by loadCaseStudies
	private loadCaseStudyFiles(path: string): void {
		fs.readFile(path, 'utf8', (err, data) => {
			if (err) {
				vscode.window.showErrorMessage(`Error reading file from disk: ${err}`);
			} else {
				// parse JSON string to JSON object
				var newTree = [];
				try {
					newTree = JSON.parse(data);
				} catch(e) {
					vscode.window.showErrorMessage(`Error - not a JSON file: ${e}`);
					return;
				}
				tree = newTree;
				this.refresh();
				this.filePath = path;
				vscode.window.showInformationMessage('Loaded: '+path);
			}
		});	
	}
	
	// UI menu command to load case study from dialogue box
	loadCaseStudiesFromDisk(): void {
		vscode.window.showOpenDialog(options).then(fileUri => {
			if (fileUri && fileUri[0]) {
				//console.log('Selected file: ' + fileUri[0].fsPath);
				this.loadCaseStudyFiles(fileUri[0].fsPath);
			}
		});	
	}

	// save request to webview
	postSaveRequest(customer: string){
		if (this.panel?.webview !== null){
			// send load message to webview
			this.panel?.webview.postMessage({ command: 'save', customer: this.customer});
		}	
	}

	
	// UI menu command to save case study to disk
	saveCaseStudiesToDisk(): void {
		if (this.bEdited){
			const jsonData = JSON.stringify(tree);
			fs.writeFile(this.filePath,jsonData,  (err) => {
				if (err){
					console.log(err);
					vscode.window.showInformationMessage(`Could not save to ${this.filePath}`);
				}
				else {
					vscode.window.showInformationMessage(`Saved: ${this.filePath}`);
					this.bEdited = false;
				}
			});
		}
	}
	


	// menu command to edit caseStudy

	// -------------------------------------------------------------------------------------------
	// Tree Functions

    // return the UI representation (TreeItem) of the element that gets displayed in the view
	getTreeItem(element: CaseStudy): vscode.TreeItem {
		//console.log(element);
		return element;
	}

    // return the children for the given element or root (if no element is passed)
	getChildren(element?: CaseStudy): Thenable<CaseStudy[]> {
		if (element || this.bFirstTime ) {
			this.bFirstTime = false;
			return Promise.resolve([]);
		} else {
            return Promise.resolve(this.getCaseStudies());
		}
	}
	
	// return parent of element
	getParent(element?: CaseStudy): vscode.ProviderResult<CaseStudy>{
		const result: vscode.ProviderResult<CaseStudy> = undefined;
		//caseStudy : CaseStudy | undefined;
		return Promise.resolve(result); // single level tree
	}
    
    /**
     * return array of CaseStudy Tree Items
     *  
     */
    private getCaseStudies(): Array<CaseStudy> {
        var caseStudies: Array<CaseStudy> = [];
		
		if (tree.caseStudies.length > 0){
			tree.caseStudies.forEach(element => {
				var childNode = new CaseStudy(element.customer,element.country, element.sector, vscode.TreeItemCollapsibleState.None);
				caseStudies.push(childNode);
			});
		}
		this.caseStudies = caseStudies;

        return caseStudies;
    }

	
	//************************************************************************************************* */
	// Webview

	

	private createWebView(context: vscode.ExtensionContext): void {
		// create and show Panel
		const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
		if (this.panel){
			// already exists so reveal
			this.panel.reveal();
		} else {
			// create a new one
			this.panel = vscode.window.createWebviewPanel(
				'caseStudyPanel',
				'Case Study',
				vscode.ViewColumn.One,
				{
					// enable scripts
					enableScripts: true,
					localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
				}
			);
			
			// exists
			this.bWebViewExists = true;

			// load HTML
			this.panel.webview.html = this.getWebviewContent(context);

			// Handle messages from the webview
			this.panel.webview.onDidReceiveMessage(
				message => {
				  console.log("got message:"+message.command);
				  console.log(message);
				  switch (message.command) {
					case 'alert':
					  vscode.window.showErrorMessage(message.text);
					  return;
					case 'edited':
					  console.log(message.message);
					  this.stashCustomerVals = message.message;
					  this.updateEditStatus(true);
					  this.bEdited = true;			  
					  return;
					case 'reset':
					  console.log('reset');
					  this.loadCaseStudy(this.customer);
					  this.updateEditStatus(false);
					  return;
					case 'save':
					  console.log('save');
					  this.saveCaseStudy(message.message);
					  this.updateEditStatus(false);
					  return;
				  }
				},
				undefined,
				context.subscriptions
			);

			// update on view state change
			this.panel.onDidChangeViewState(e =>{
				console.log("view state");
				this.reloadCaseStudy();
				console.log(e);
			});

			// reset when disposed
			this.panel.onDidDispose(
				() => {
					console.log(this.panel);
					this.panel = undefined;
					console.log("disposed");
					this.bWebViewExists = false;

					// save case study if edited
					if (this.bEdited){
						// confirm save before moving on
						this.confirmDiscardDialogue(this.customer).then((result)=>{
							switch (result) {
								case 'Discard':
								//	this.loadCaseStudy(caseStudy.l
									this.bEdited = false;
									break;
								case 'Cancel':
									this.reloadCaseStudy();
									this.selectCaseStudy(this.customer);
									//this.panel?.reveal();
									break;
							}
						});
					}

				},
				null,
				context.subscriptions
			);
		}
	}

	private getWebviewURI(filepath: string) : vscode.Uri {
		const diskPath = vscode.Uri.file(filepath);
		if (this.panel){
			return this.panel.webview.asWebviewUri(diskPath);
		}
		else {
			return vscode.Uri.file('');
		}	
	}

	getWebviewContent(context: vscode.ExtensionContext): string {
			// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
			const scriptUri = this.getWebviewURI(path.join(context.extensionPath,'media', 'main.js'));

			// Do the same for the stylesheet.
			const styleResetUri = this.getWebviewURI(path.join(context.extensionPath,'media', 'reset.css'));
			const styleVSCodeUri = this.getWebviewURI(path.join(context.extensionPath,'media', 'vscode.css'));
			const styleMainUri = this.getWebviewURI(path.join(context.extensionPath,'media', 'main.css'));
	
			// Use a nonce to only allow a specific script to be run.
			const nonce = getNonce();
	
			return `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
	
					<!--
						Use a content security policy to only allow loading images from https or from our extension directory,
						and only allow scripts that have a specific nonce.
					-->
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this.panel?.webview.cspSource}; script-src 'nonce-${nonce}';">

					<meta name="viewport" content="width=device-width, initial-scale=1.0">
	
					<link href="${styleResetUri}" rel="stylesheet">
					<link href="${styleVSCodeUri}" rel="stylesheet">
					<link href="${styleMainUri}" rel="stylesheet">
					
					<title>Cat Colors</title>
				</head>
				<body>
				<div class="container">
				<form action="">
        <div class="form-group">
          <label for="customer">Customer:</label>
          <input type="text" class="form-control" id="customer">
        </div>
        <div class="form-group">
            <label for="sector">Country:</label>
            <input type="text" class="form-control" id="country">
        </div>
        <div class="form-group">
            <label for="country">Sector:</label>
            <select class="form-control" id="sector">
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
            </select>
        </div>
        <div class="form-group">
            <label for="url">Url:</label>
            <input 
            type="text" class="form-control" id="url">
        </div>
        <div class="form-group">
            <label for="byline">Byline:</label>
            <input 
            type="text" class="form-control" id="byline">
        </div>   
        <div class="form-group">
            <label for="challenge">Challenge:</label>
            <textarea class="form-control" rows="3" id="challenge"></textarea>
        </div>
        <div class="form-group">
            <label for="solution">Solution:</label>
            <textarea class="form-control" rows="3" id="solution"></textarea>
        </div>
        <div class="form-group row">
            <div class="column-edge">
                <label for="technologies">Current Technologies:</label>
                <select class="form-control" id="technologies" size="5">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                </select>
            </div>
            <div class= "column-middle">
                
                <button type="button" class="btn btn-default" id="but-add" disabled >&lsaquo;&lsaquo; Add</button><br>
                <button type="button" class="btn btn-default" id="but-remove" disabled >Remove &rsaquo;&rsaquo;</button>
            </div>  
            <div class="column-edge">
                <label for="technology-list">Available Technologies:</label>
                <select class="form-control" id="technology-list" size="5">
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5</option>
                </select>
            </div>
        </div>
        <button type="button" class="btn btn-default" id="but-reset" disabled >Reset</button>
        <button type="button" class="btn btn-default" id="but-save" disabled >Save</button>
        
        
	</form>
	</div>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
				</html>`;
	}

	
	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
