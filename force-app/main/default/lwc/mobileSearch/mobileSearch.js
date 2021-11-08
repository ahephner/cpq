import { LightningElement, api } from 'lwc';
import searchProduct from '@salesforce/apex/cpqApex.searchProduct';

export default class MobileSearch extends LightningElement {
    queryTerm;
    cat = 'All';  
    pf = 'All';
    priceBookId = '01s410000077vSKAAY'; 
    prod; 
    loaded = false;
    connectedCallback(){
        this.loaded = true; 
    }
    //searchTerm
    handleKeyUp(evt) {
        const isEnterKey = evt.keyCode === 13;
        if (isEnterKey) {
            this.queryTerm = evt.target.value;
            this.search();
        }
    }
    search(){
        this.loaded = false; 
        searchProduct({searchKey: this.queryTerm, cat: this.cat, family: this.pf, priceBookId:this.priceBookId})
            .then((results)=>{
                this.prod = results;
                console.log(JSON.stringify(this.prod)) 
            }).catch((error)=>{
                this.error = error;
                console.log('error -->'+error);
            }).finally(()=>{
                    this.loaded = true; 
            })
    }
    handleSave(){
        console.log('save');
        
    }

    handleCancel(){
        console.log('cancel');
        
    }
}