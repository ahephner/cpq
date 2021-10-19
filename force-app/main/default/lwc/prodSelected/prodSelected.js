//Goes with prodSeach!!!!!
//has to be a way to call apex on the new products selected here
import { LightningElement, api } from 'lwc';

export default class ProdSelected extends LightningElement {
    @api
    selection

    removeProd(x){
        let xId = x.target.name; 
        this.dispatchEvent(new CustomEvent('update', {
            detail: xId
        })); 
        //console.log('selected id '+ xId);
        
    }
}