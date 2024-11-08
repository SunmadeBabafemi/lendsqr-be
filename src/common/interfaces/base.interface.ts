export interface BackDaterResponse extends Object {
	format: string;
	array: backDaterArray[];
}

export interface backDaterArray extends Object {
	start: Date;
	end: Date;
	day?: string;
	month?: string;
}

export interface FacetStage {
	[key: string]: any;
}

export interface requestProp {
	url: string;
	method: string;
	params?: any;
	body?: any;
	headers?: any;
}
