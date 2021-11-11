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
    findProduct(sel){
        let index = this.prod.findIndex(item => item.Id === sel)
        return this.prod[index];
    }
    addProduct(e){
        let pc = e.target.name;
        //console.log('pc '+pc);
        const pd = this.findProduct(pc);
        console.log('pd '+pd.Name, 1);
                
        this.dispatchEvent(new CustomEvent('newprod',{
            detail: pd
        }))
    }

    @api
    showResult(mess){
        console.log('mess ' +mess); 
    }
    handleDone(){
        console.log('dispatch');
        
        this.loaded = false;
        this.dispatchEvent(new CustomEvent('close'));
        
    }

    handleCancel(){
        console.log('cancel');
        
    }
}