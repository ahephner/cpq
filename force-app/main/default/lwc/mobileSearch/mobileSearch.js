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
    //!!!!!!!!!!!!!!NEED TO FIX IF STRNG IS EMPTY OR BLANK
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
                results.forEach(x =>{
                    x.Name = x.Product2.Name,
                    x.ProductCode = x.Product2.ProductCode
                })
                this.prod = results; 
                console.log(JSON.stringify(this.prod))
                
            }).catch((error)=>{
                this.error = error;
                console.log('error -->'+error);
            }).finally(()=>{
                    this.loaded = true; 
                    
            })
    }

    addProduct(e){
        let pc = e.target.name;
        //console.log('pc '+pc);
        
        this.dispatchEvent(new CustomEvent('newprod',{
            detail: pc
        }))
    }

    @api
    showResult(mess){
        console.log('mess ' +mess); 
    }
    handleSave(){
        console.log('save');
        
    }

    handleCancel(){
        console.log('cancel');
        
    }
}