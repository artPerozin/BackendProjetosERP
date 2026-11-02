import HttpMethods from "./HttpMethods";

export default interface Http {
    route(method: HttpMethods, url: string, auth: boolean, callback: any): Promise<any>;
    uploadRoute(url: string, auth: boolean, callback: any, autorizar?: (usuario: any) => void): Promise<any>;
    downloadRoute(url: string, auth: boolean): Promise<any>;
    swagger(specification: object): void;
    listen(port: number): Promise<void>;
}
